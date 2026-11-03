import type { UploadImageResult, UploadResult } from '@/types/api';
import { API_BASE_URL } from '../env';

export interface UploadOptions {
  file: File;
  onProgress?: (percent: number) => void;
}

function uploadFile<T>(path: string, { file, onProgress }: UploadOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch (parseError) {
          reject(parseError);
        }
        return;
      }
      let message = `Upload failed: ${xhr.status}`;
      try {
        const data = JSON.parse(xhr.responseText) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        // body wasn't json
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error('Помилка мережі'));

    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export const uploadsApi = {
  uploadVideo: (options: UploadOptions): Promise<UploadResult> =>
    uploadFile<UploadResult>('/uploads/video', options),
  uploadImage: (options: UploadOptions): Promise<UploadImageResult> =>
    uploadFile<UploadImageResult>('/uploads/image', options),
};
