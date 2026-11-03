'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productTagsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/keys';
import type { ProductTag } from '@/types/api';
import type {
  CreateProductTagInput,
  UpdateProductTagInput,
} from '@/lib/api/product-tags';

const sortByTime = (tags: ProductTag[]): ProductTag[] =>
  [...tags].sort((a, b) => a.time - b.time);

export const useProductTags = (videoId: string) =>
  useQuery({
    queryKey: queryKeys.videos.productTags(videoId),
    queryFn: () => productTagsApi.list(videoId),
    enabled: Boolean(videoId),
  });

export const useCreateProductTag = (videoId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['product-tag', 'create', videoId],
    mutationFn: (input: CreateProductTagInput) =>
      productTagsApi.create(videoId, input),
    onSuccess: (created) => {
      queryClient.setQueryData<ProductTag[]>(
        queryKeys.videos.productTags(videoId),
        (prev) => sortByTime([...(prev ?? []), created]),
      );
    },
  });
};

export const useUpdateProductTag = (videoId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['product-tag', 'update', videoId],
    mutationFn: ({
      tagId,
      patch,
    }: {
      tagId: string;
      patch: UpdateProductTagInput;
    }) => productTagsApi.update(videoId, tagId, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<ProductTag[]>(
        queryKeys.videos.productTags(videoId),
        (prev) =>
          sortByTime(
            (prev ?? []).map((tag) => (tag.id === updated.id ? updated : tag)),
          ),
      );
    },
  });
};

export const useDeleteProductTag = (videoId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['product-tag', 'delete', videoId],
    mutationFn: (tagId: string) => productTagsApi.remove(videoId, tagId),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<ProductTag[]>(
        queryKeys.videos.productTags(videoId),
        (prev) => (prev ?? []).filter((tag) => tag.id !== deletedId),
      );
    },
  });
};
