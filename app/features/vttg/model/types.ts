export interface CarouselCard {
  title: string;
  description: string;
  img: string;
  icon: string;
}

export interface FeatureItem {
  badge: string;
  badgeVariant: 'new' | 'beta' | 'soon';
  title: string;
  description: string;
  img: string;
  icon: string;
}

export interface FaqItem {
  label: string;
  content: string;
}

export interface VttgHighlight {
  icon: string;
  title: string;
  description: string;
}

export interface VttgHeading {
  title: string;
  subtitle?: string;
}

export const VIDEO_EXTENSIONS = ['.webm', '.mp4'] as const;

export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];
