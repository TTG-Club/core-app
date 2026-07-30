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

/** Платформа, на которой можно запустить VTTG. */
export interface VttgDownloadPlatform {
  /** Идентификатор платформы. */
  id: 'windows' | 'vds' | 'mac';
  /** Название платформы для подписи кнопки. */
  name: string;
  /** Иконка платформы. */
  icon: string;
  /** Готова ли сборка — у неготовых кнопка выключена с пометкой «скоро». */
  ready: boolean;
}

export const VIDEO_EXTENSIONS = ['.webm', '.mp4'] as const;

export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];
