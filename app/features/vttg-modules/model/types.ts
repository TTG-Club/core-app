import type { SUBMISSION_STATUSES } from './constants';

/** Статус заявки на модуль. */
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** Игровая система из справочника реестра. */
export interface VttgGameSystem {
  id: string;
  name: string;
}

/** Снимок `module.json` в заявке. */
export interface SubmissionModuleInfo {
  id: string;
  name: string;
  version: string;
  author: string | null;
  icon: string | null;
  downloadUrl: string;
  /** Манифест как пришёл из репозитория. */
  manifest: string;
  syncedAt: string;
}

/** Решение модератора. */
export interface SubmissionModeration {
  moderatorId: string | null;
  comment: string | null;
  reviewedAt: string;
}

/** Заявка на включение модуля в каталог. */
export interface ModuleSubmission {
  id: string;
  status: SubmissionStatus;
  authorId: string;
  authorName: string | null;
  repositoryUrl: string;
  manifestUrl: string;
  description: string;
  /** Системы из манифеста модуля; пустой список — модуль универсальный. */
  systemIds: Array<string>;
  module: SubmissionModuleInfo;
  moderation: SubmissionModeration | null;
  /** Ссылки зафиксированы первым одобрением: сменить их можно только новой заявкой. */
  linksLocked: boolean;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Данные формы заявки. Репозиторий сервис берёт из ссылки на манифест, а
 * игровые системы — из `compatibleSystems` самого манифеста.
 */
export interface SubmissionRequest {
  manifestUrl: string;
  description: string;
}

/** Страница очереди модерации. */
export interface SubmissionsPage {
  content: Array<ModuleSubmission>;
  totalElements: number;
}
