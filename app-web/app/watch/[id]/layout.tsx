import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api';
import type { Video } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const generateMetadata = async ({
  params,
}: RouteParams): Promise<Metadata> => {
  const { id } = await params;
  const result = await serverFetch<Video>(`/videos/${id}`);
  if (result.status !== 'ok') {
    return { title: 'Відео · TagShop Video' };
  }
  const video = result.data;
  const title = `${video.title} · TagShop Video`;
  const description =
    'Інтерактивне shoppable відео — натисніть на товари у відео, щоб купити.';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'video.other',
      images: video.thumbnailUrl ? [{ url: video.thumbnailUrl }] : undefined,
      videos: [{ url: video.videoUrl }],
    },
    twitter: {
      card: video.thumbnailUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: video.thumbnailUrl ? [video.thumbnailUrl] : undefined,
    },
  };
};

interface WatchLayoutProps extends RouteParams {
  children: React.ReactNode;
}

const WatchLayout = async ({ children, params }: WatchLayoutProps) => {
  const { id } = await params;
  const result = await serverFetch<Video>(`/videos/${id}`);
  if (result.status === 'not-found') notFound();
  return children;
};

export default WatchLayout;
