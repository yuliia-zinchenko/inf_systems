'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videosApi, uploadsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/keys';
import type { Video } from '@/types/api';

export const useMyVideos = () =>
  useQuery({
    queryKey: queryKeys.videos.all,
    queryFn: () => videosApi.list(),
  });

export const useVideo = (id: string) =>
  useQuery({
    queryKey: queryKeys.videos.detail(id),
    queryFn: () => videosApi.get(id),
    enabled: Boolean(id),
  });

export const useCreateVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['video', 'create'],
    mutationFn: videosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['video', 'update'],
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { title?: string };
    }) => videosApi.update(id, patch),
    onSuccess: (updated: Video) => {
      queryClient.setQueryData(queryKeys.videos.detail(updated.id), updated);
      queryClient.setQueryData<Video[]>(queryKeys.videos.all, (prev) =>
        prev?.map((video) => (video.id === updated.id ? updated : video)),
      );
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['video', 'delete'],
    mutationFn: (id: string) => videosApi.remove(id),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<Video[]>(queryKeys.videos.all, (prev) =>
        prev?.filter((video) => video.id !== deletedId),
      );
    },
  });
};

export const useUploadVideoFile = () =>
  useMutation({
    mutationKey: ['video', 'upload'],
    mutationFn: uploadsApi.uploadVideo,
  });
