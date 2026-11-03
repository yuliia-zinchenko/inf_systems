'use client';

import { useConfirm } from '@/components/feedback/confirm-dialog';
import { useToast } from '@/components/feedback/toast';
import { Badge } from '@/components/ui/badge';
import {
  useDeleteProductTag,
  useUpdateProductTag,
} from '@/features/product-tags/hooks/use-product-tags';
import type { ProductTag } from '@/types/api';
import type { UpdateProductTagInput } from '@/lib/api/product-tags';
import { ProductTagListItem } from './product-tag-list-item';

interface ProductTagListProps {
  videoId: string;
  tags: ProductTag[];
  onJump: (time: number) => void;
  onCaptureTime: () => number;
}

export const ProductTagList = ({
  videoId,
  tags,
  onJump,
  onCaptureTime,
}: ProductTagListProps) => {
  const toast = useToast();
  const confirm = useConfirm();
  const updateTag = useUpdateProductTag(videoId);
  const deleteTag = useDeleteProductTag(videoId);

  const handleDelete = async (tagId: string): Promise<void> => {
    const ok = await confirm({
      title: 'Видалити товар?',
      description: 'Тег зникне з відео й аналітики цього тегу більше не буде.',
      confirmLabel: 'Видалити',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteTag.mutateAsync(tagId);
      toast.success('Товар видалено');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  };

  const handleUpdate = async (
    tagId: string,
    patch: UpdateProductTagInput,
  ): Promise<void> => {
    await updateTag.mutateAsync({ tagId, patch });
  };

  return (
    <div className="rounded-2xl bg-surface-strong border border-border-strong backdrop-blur-xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Товари</h2>
        <Badge>{tags.length}</Badge>
      </div>
      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Поки що порожньо. Додайте перший товар у формі.
        </p>
      ) : (
        <ul className="mt-4 flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
          {tags.map((tag) => (
            <ProductTagListItem
              key={tag.id}
              tag={tag}
              onJump={onJump}
              onCaptureTime={onCaptureTime}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
