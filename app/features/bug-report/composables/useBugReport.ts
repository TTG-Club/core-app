import type { BugReportCreateRequest, TextSelection } from '../model';

import { v4 as createUuid } from 'uuid';

import {
  BUG_REPORT_API_URL,
  BUG_REPORT_SUBMIT_ERROR_DESC,
  BUG_REPORT_SUBMIT_ERROR_TITLE,
  BUG_REPORT_SUBMIT_SUCCESS_DESC,
  BUG_REPORT_SUBMIT_SUCCESS_TITLE,
  SOURCE_PLATFORM,
} from '../model';

/**
 * Форматирует выделенный текст с контекстом в строку вида `...before[selected]after...`.
 *
 * @param selection Контекст выделенного текста.
 */
function formatSelectionText(selection: TextSelection): string {
  const prefix = selection.before ? `...${selection.before}` : '';
  const suffix = selection.after ? `${selection.after}...` : '';

  return `${prefix}[${selection.selected}]${suffix}`;
}

/**
 * Композабл для управления состоянием баг-репорта.
 *
 * Оркестрирует поток: открытие модалки → вставка скриншота → отправка.
 * Использует `useState` для глобального реактивного состояния.
 */
export function useBugReport() {
  const route = useRoute();
  const router = useRouter();
  const $toast = useToast();

  const isModalOpen = useState('bug-report:modal-open', () => false);
  const screenshot = useState<Blob | null>('bug-report:screenshot', () => null);
  const capturedPageUrl = useState('bug-report:page-url', () => '');

  const textSelection = useState<TextSelection | null>(
    'bug-report:text-selection',
    () => null,
  );

  // Путь сущности, открытой в overlay-drawer-е (стандартный режим).
  const { openEntityPath } = useOpenEntityPath();

  /**
   * Открывает модальное окно баг-репорта.
   *
   * Сохраняет текущий URL страницы для контекста:
   * - Широкий режим: если открыт детальный вид через query "detail",
   *   URL преобразуется в прямой путь вида /path/detailId.
   * - Стандартный режим: если открыт overlay-drawer, берётся его путь
   *   из {@link useOpenEntityPath} (маршрут в этом режиме не меняется).
   * - Иначе — текущий путь страницы.
   */
  function openReport(): void {
    const detailId = route.query.detail;

    if (typeof detailId === 'string' && detailId) {
      const basePath = route.path.endsWith('/')
        ? route.path.slice(0, -1)
        : route.path;

      const nextQuery = { ...route.query };

      delete nextQuery.detail;

      const resolved = router.resolve({
        path: `${basePath}/${detailId}`,
        query: nextQuery,
      });

      capturedPageUrl.value = resolved.fullPath;
    } else if (openEntityPath.value) {
      // openEntityPath — уже относительный путь вида /feats/unarmed-fighting.
      capturedPageUrl.value = openEntityPath.value;
    } else {
      capturedPageUrl.value = route.fullPath;
    }

    isModalOpen.value = true;
  }

  /**
   * Открывает модальное окно с контекстом выделенного текста.
   *
   * Сохраняет выделенный фрагмент и окружающий текст для отображения в модалке.
   */
  function openReportWithSelection(selection: TextSelection): void {
    textSelection.value = selection;
    openReport();
  }

  /**
   * Закрывает модальное окно и сбрасывает состояние.
   */
  function cancel(): void {
    isModalOpen.value = false;
    screenshot.value = null;
    capturedPageUrl.value = '';
    textSelection.value = null;
  }

  /**
   * Отправляет баг-репорт на сервер.
   *
   * Формирует FormData с JSON-объектом запроса и файлом скриншота,
   * передает JWT-токен авторизации из кук при его наличии.
   * Возвращает true при успешной отправке и false при ошибке.
   */
  async function submit(
    description: string,
    screenshotBlob: Blob | null,
  ): Promise<boolean> {
    const userTokenCookie = useCookie<string | null>('ttg-user-token');
    const guestId = useLocalStorage('bug-report:guest-id', () => createUuid());

    const formattedSelectedText = textSelection.value
      ? formatSelectionText(textSelection.value)
      : undefined;

    const requestData: BugReportCreateRequest = {
      description,
      url: capturedPageUrl.value || undefined,
      sourcePlatform: SOURCE_PLATFORM,
      sessionId: userTokenCookie.value ? undefined : guestId.value,
      selectedText: formattedSelectedText,
    };

    const formData = new FormData();

    formData.append(
      'request',
      new Blob([JSON.stringify(requestData)], { type: 'application/json' }),
    );

    if (screenshotBlob) {
      formData.append('screenshot', screenshotBlob, 'screenshot.png');
    }

    try {
      const headers: Record<string, string> = {};

      if (userTokenCookie.value) {
        headers.Authorization = `Bearer ${userTokenCookie.value}`;
      }

      await $fetch(BUG_REPORT_API_URL, {
        method: 'POST',
        body: formData,
        headers,
      });

      $toast.add({
        color: 'success',
        title: BUG_REPORT_SUBMIT_SUCCESS_TITLE,
        description: BUG_REPORT_SUBMIT_SUCCESS_DESC,
        icon: 'tabler:bug',
      });

      cancel();

      return true;
    } catch (error) {
      consola.error('Ошибка при отправке баг-репорта:', error);

      $toast.add({
        color: 'error',
        title: BUG_REPORT_SUBMIT_ERROR_TITLE,
        description: BUG_REPORT_SUBMIT_ERROR_DESC,
        icon: 'tabler:alert-triangle',
      });

      return false;
    }
  }

  /**
   * Устанавливает новый скриншот из буфера обмена.
   */
  function setScreenshot(blob: Blob): void {
    screenshot.value = blob;
  }

  /**
   * Удаляет текущий скриншот.
   */
  function clearScreenshot(): void {
    screenshot.value = null;
  }

  /**
   * Удаляет контекст выделенного текста.
   */
  function clearTextSelection(): void {
    textSelection.value = null;
  }

  return {
    isModalOpen,
    screenshot: readonly(screenshot),
    capturedPageUrl: readonly(capturedPageUrl),
    textSelection: readonly(textSelection),

    openReport,
    openReportWithSelection,
    setScreenshot,
    clearScreenshot,
    clearTextSelection,
    cancel,
    submit,
  };
}
