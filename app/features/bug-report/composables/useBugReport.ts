import type { BugReportPayload, TextSelection } from '../model';

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
   * Отправляет баг-репорт (заглушка).
   *
   * Пока API не реализовано, логирует данные в консоль и показывает тост.
   * Структура `BugReportPayload` готова для подключения реального API.
   */
  function submit(description: string, screenshotBlob: Blob | null) {
    const { user } = useUser();

    const payload: BugReportPayload = {
      screenshot: screenshotBlob,
      description,
      author: user.value?.username ?? null,
      pageUrl: capturedPageUrl.value,
      selectedText: textSelection.value,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // TODO: заменить на реальный API-вызов
    consola.info('Bug report payload:', {
      ...payload,
      screenshot: payload.screenshot
        ? `Blob (${payload.screenshot.size} bytes)`
        : 'Нет скриншота',
    });

    $toast.add({
      color: 'success',
      title: 'Репорт отправлен',
      description: 'Спасибо за обратную связь! Мы рассмотрим ваш репорт.',
      icon: 'tabler:bug',
    });

    cancel();
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
