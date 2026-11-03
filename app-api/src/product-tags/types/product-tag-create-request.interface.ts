export interface ProductTagCreateRequestBody {
  time: number;
  duration?: number;
  title: string;
  imageUrl: string;
  link: string;
  variant?: 'card' | 'compact' | 'badge' | 'minimal';
  accentColor?: 'fuchsia' | 'emerald' | 'sky' | 'amber' | 'rose' | 'white';
  positionX?: number | null;
  positionY?: number | null;
}
