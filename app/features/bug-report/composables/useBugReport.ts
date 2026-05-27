import type { BugReportCreateRequest, TextSelection } from '../model';

import { v4 as createUuid } from 'uuid';

import { BUG_REPORT_API_URL, SOURCE_PLATFORM } from '../model';

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
  const $toast = useToast();

  const isModalOpen = useState('bug-report:modal-open', () => false);
  const screenshot = useState<Blob | null>('bug-report:screenshot', () => null);
  const capturedPageUrl = useState('bug-report:page-url', () => '');

  const textSelection = useState<TextSelection | null>(
    'bug-report:text-selection',
    () => null,
  );

  /**
   * Открывает модальное окно баг-репорта.
   *
   * Сохраняет текущий URL страницы для контекста.
   */
  function openReport() {
    capturedPageUrl.value = route.fullPath;
    isModalOpen.value = true;
  }

  /**
   * Открывает модальное окно с контекстом выделенного текста.
   *
   * Сохраняет выделенный фрагмент и окружающий текст для отображения в модалке.
   */
  function openReportWithSelection(selection: TextSelection) {
    textSelection.value = selection;
    openReport();
  }

  /**
   * Закрывает модальное окно и сбрасывает состояние.
   */
  function cancel() {
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
        title: 'Репорт отправлен',
        description: 'Спасибо за обратную связь! Мы рассмотрим ваш репорт.',
        icon: 'tabler:bug',
      });

      cancel();

      return true;
    } catch (error) {
      consola.error('Ошибка при отправке баг-репорта:', error);

      $toast.add({
        color: 'error',
        title: 'Ошибка отправки',
        description:
          'Не удалось отправить баг-репорт. Пожалуйста, попробуйте позже.',
        icon: 'tabler:alert-triangle',
      });

      return false;
    }
  }

  /**
   * Устанавливает новый скриншот из буфера обмена.
   */
  function setScreenshot(blob: Blob) {
    screenshot.value = blob;
  }

  /**
   * Удаляет текущий скриншот.
   */
  function clearScreenshot() {
    screenshot.value = null;
  }

  /**
   * Удаляет контекст выделенного текста.
   */
  function clearTextSelection() {
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
