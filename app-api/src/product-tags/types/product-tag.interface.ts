export type ProductTagVariant = 'card' | 'compact' | 'badge' | 'minimal';
export type ProductTagAccent =
  | 'fuchsia'
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'white';

export interface ProductTag {
  id: string;
  videoId: string;
  time: number;
  duration: number;
  title: string;
  imageUrl: string;
  link: string;
  variant: ProductTagVariant;
  accentColor: ProductTagAccent;
  /** Optional position in % of the player (0..100). Both null = default stack. */
  positionX: number | null;
  positionY: number | null;
}
