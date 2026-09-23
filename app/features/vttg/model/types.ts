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

/** Папка или файл на диске для конкретной операционной системы. */
export interface VttgGuideLocation {
  /** Операционная система — «Windows», «macOS», «Linux». */
  label: string;
  /** Иконка операционной системы. */
  icon: string;
  /** Путь, который человек вставляет в проводник или терминал. */
  path: string;
}

/** Фрагмент кода в шаге инструкции: команда или пример содержимого файла. */
export interface VttgGuideCode {
  /** Подпись над фрагментом — «Было», «Команда». */
  caption: string;
  /** Текст фрагмента; копируется кнопкой целиком. */
  content: string;
}

/** Шаг инструкции. */
export interface VttgGuideStep {
  title: string;
  /** Абзацы пояснения. */
  paragraphs: Array<string>;
  /** Пути для разных операционных систем после абзацев. */
  locations?: Array<VttgGuideLocation>;
  /** Команды или примеры после абзацев. */
  codes?: Array<VttgGuideCode>;
  /** Предупреждение в конце шага. */
  warning?: string;
}

/** Вариант установки VTTG со своим порядком сброса пароля. */
export interface VttgGuideVariant {
  label: string;
  icon: string;
  /** Для кого этот вариант — абзац над шагами. */
  description: string;
  steps: Array<VttgGuideStep>;
  /** Сборка ещё не выдаётся пользователям — вкладка не показывается. */
  hidden?: boolean;
}

export const VIDEO_EXTENSIONS = ['.webm', '.mp4'] as const;

export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];
