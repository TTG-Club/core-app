import type {
  MyBugReportChanges,
  MyBugReportResponse,
  MyBugReportSeenSnapshot,
} from '../../model';

import {
  MY_BUGS_SEEN_REPORTS_LIMIT,
  MY_BUGS_SEEN_REPORTS_STORAGE_KEY,
} from '../../model';

/** Карта снимков: идентификатор репорта → что автор уже видел. */
type SeenSnapshots = Record<string, MyBugReportSeenSnapshot>;

/**
 * Собирает снимок текущего состояния репорта.
 *
 * @param bugReport Баг-репорт автора.
 */
function toSnapshot(bugReport: MyBugReportResponse): MyBugReportSeenSnapshot {
  return {
    statusUpdatedAt: bugReport.statusUpdatedAt ?? '',
    status: bugReport.status,
    statusComment: bugReport.statusComment ?? '',
  };
}

/**
 * Отбрасывает самые старые снимки, если карта переросла лимит.
 * Сортировка по дате изменения: свежие репорты автору интереснее старых.
 *
 * @param snapshots Карта снимков.
 */
function pruneSnapshots(snapshots: SeenSnapshots): SeenSnapshots {
  const entries = Object.entries(snapshots);

  if (entries.length <= MY_BUGS_SEEN_REPORTS_LIMIT) {
    return snapshots;
  }

  const kept = entries
    .sort(([, first], [, second]) =>
      second.statusUpdatedAt.localeCompare(first.statusUpdatedAt),
    )
    .slice(0, MY_BUGS_SEEN_REPORTS_LIMIT);

  return Object.fromEntries(kept);
}

/** Описание возвращаемого значения композабла useMyBugReportReadState. */
export interface UseMyBugReportReadStateReturn {
  /** Что изменилось в репорте с прошлого просмотра */
  resolveChanges: (bugReport: MyBugReportResponse) => MyBugReportChanges;

  /** Пометить репорт прочитанным — сохранить его текущее состояние */
  markRead: (bugReport: MyBugReportResponse) => void;
}

/**
 * Состояние прочтения баг-репортов автора.
 *
 * Снимок пишется и для репортов, которых модератор ещё не касался: без такой
 * «нулевой отметки» первое же изменение нечем было бы сравнить, и вместо
 * «обновили статус» автор видел бы обезличенное «есть обновление» — а это как
 * раз самый частый случай.
 *
 * Хранит по каждому репорту снимок того, что автор уже видел: сравнением с ним
 * определяется не только факт изменения, но и его смысл — сменили статус или
 * добавили комментарий. Одной общей отметки времени для этого не хватает: она
 * говорит «что-то поменялось», но не говорит что.
 */
export function useMyBugReportReadState(): UseMyBugReportReadStateReturn {
  const snapshots = useLocalStorage<SeenSnapshots>(
    MY_BUGS_SEEN_REPORTS_STORAGE_KEY,
    () => ({}),
  );

  function resolveChanges(bugReport: MyBugReportResponse): MyBugReportChanges {
    // Статус ни разу не меняли — читать нечего.
    if (!bugReport.statusUpdatedAt) {
      return {
        isUnread: false,
        hasStatusChange: false,
        hasCommentChange: false,
      };
    }

    const seen = snapshots.value[bugReport.id];

    // Снимка нет: репорт меняли, но с чем сравнивать — неизвестно. Отмечаем
    // изменение без уточнения, иначе пришлось бы врать о его характере.
    if (!seen) {
      return {
        isUnread: true,
        hasStatusChange: false,
        hasCommentChange: false,
      };
    }

    if (seen.statusUpdatedAt === bugReport.statusUpdatedAt) {
      return {
        isUnread: false,
        hasStatusChange: false,
        hasCommentChange: false,
      };
    }

    const hasStatusChange = seen.status !== bugReport.status;

    const hasCommentChange =
      seen.statusComment !== (bugReport.statusComment ?? '');

    return {
      isUnread: true,
      hasStatusChange,
      hasCommentChange,
    };
  }

  function markRead(bugReport: MyBugReportResponse): void {
    const seen = snapshots.value[bugReport.id];

    // Повторная запись того же снимка перезаписала бы localStorage на каждом
    // появлении карточки в зоне видимости.
    if (seen && seen.statusUpdatedAt === (bugReport.statusUpdatedAt ?? '')) {
      return;
    }

    snapshots.value = pruneSnapshots({
      ...snapshots.value,
      [bugReport.id]: toSnapshot(bugReport),
    });
  }

  return { resolveChanges, markRead };
}
