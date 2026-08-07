import type { VttgBuildId } from '#shared/types';

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

/** Группа блока загрузок: приложение на свой компьютер или сервер для команды. */
export type VttgBuildGroupId = 'desktop' | 'server';

/** Группа сборок с заголовком в списке загрузок. */
export interface VttgBuildGroup {
  id: VttgBuildGroupId;
  label: string;
  /** Кому нужны сборки группы — одна строка под заголовком. */
  hint: string;
}

/**
 * Как сборка выглядит в списке. Готовность и версия сюда не входят: их каждый
 * раз приносит канал обновлений (`/api/vttg/builds`), а не код сайта.
 */
export interface VttgBuildDescriptor {
  id: VttgBuildId;
  group: VttgBuildGroupId;
  /** Название сборки — «Windows», «macOS (Apple Silicon)», «Linux ARM64». */
  name: string;
  /** Иконка платформы. */
  icon: string;
}

export const VIDEO_EXTENSIONS = ['.webm', '.mp4'] as const;

export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];
