import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api';
import type { Video } from '@/types/api';

interface EmbedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const EmbedLayout = async ({ children, params }: EmbedLayoutProps) => {
  const { id } = await params;
  const result = await serverFetch<Video>(`/videos/${id}`);
  if (result.status === 'not-found') notFound();
  return children;
};

export default EmbedLayout;
