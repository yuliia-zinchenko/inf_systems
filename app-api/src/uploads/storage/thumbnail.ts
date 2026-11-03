import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { logger } from '../../application/logger.ts';
import { withSpan } from '../../application/tracing.ts';

const FFMPEG_BIN = process.env.FFMPEG_PATH ?? 'ffmpeg';

/**
 * Extract a JPEG poster frame at ~1 second from the given video buffer.
 * Returns the JPEG bytes on success, or null if ffmpeg isn't available /
 * the source can't be decoded. Never throws.
 */
export async function generateThumbnailBuffer(
  videoBuffer: Buffer,
  ext: string,
): Promise<Buffer | null> {
  const _t0 = performance.now();
  const dir = await mkdtemp(path.join(tmpdir(), 'tagshop-thumb-'));
  const inputPath = path.join(dir, `in${ext || '.mp4'}`);
  const outputPath = path.join(dir, 'out.jpg');

  try {
    await writeFile(inputPath, videoBuffer);
    await withSpan('ffmpeg.thumbnail', { 'video.bytes': videoBuffer.length }, () =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn(
          FFMPEG_BIN,
          [
            '-ss', '1',
            '-i', inputPath,
            '-frames:v', '1',
            '-vf', "scale='min(640,iw)':-2",
            '-q:v', '4',
            '-y',
            outputPath,
          ],
          { stdio: ['ignore', 'ignore', 'pipe'] },
        );
        let stderr = '';
        proc.stderr.on('data', (d) => {
          stderr += d.toString();
        });
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-300)}`));
        });
      }),
    );
    const buf = await readFile(outputPath);
    logger.info(
      {
        videoBytes: videoBuffer.length,
        thumbnailBytes: buf.length,
        durationMs: Math.round(performance.now() - _t0),
      },
      'Thumbnail generated',
    );
    return buf;
  } catch (err) {
    logger.warn({ err }, 'Thumbnail generation failed');
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
