import type {
  MailingCampaign,
  MailingFormState,
  MailingSendResult,
} from '../model';

import { chunk } from 'es-toolkit';
import { FetchError } from 'ofetch';

import { MAILING_CHUNK_SIZE } from '#shared/consts';

import {
  getEmptyMailingCampaign,
  MAILING_CAMPAIGN_STORAGE_KEY,
  MAILING_SEND_API_PATH,
  MAILING_TEST_API_PATH,
  mailingSendResponseSchema,
} from '../model';

/** Получатель в запросе на отправку. */
interface MailingRequestRecipient {
  email: string;
  /** Уже выпущенный код — тогда сервер не выпускает новый, а только шлёт письмо. */
  code?: string;
}

/** Письмо рассылки без списка получателей. */
type MailingLetter = Omit<MailingCampaign, 'startedAt' | 'results'>;

/**
 * Текст ошибки, когда не ответила вся пачка: письмо могло уйти до обрыва связи,
 * поэтому повтор стоит делать осознанно.
 */
const CHUNK_FAILURE_MESSAGE =
  'Ответ от сервера не получен — проверьте, не ушло ли письмо, прежде чем повторять';

/**
 * Возвращает описание ошибки запроса.
 *
 * @param error перехваченная ошибка
 * @param fallback текст по умолчанию
 */
function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    return error.data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * Рассылка промокодов: отправляет письма пачками, копит отчёт «почта → код»
 * и переживает перезагрузку страницы.
 *
 * Пачки уходят последовательно (см. `MAILING_CHUNK_SIZE`), поэтому в интерфейсе
 * виден живой прогресс, а сервер успевает выдерживать паузу между письмами.
 */
export function useMailingCampaign() {
  const toast = useToast();

  const campaign = useLocalStorage<MailingCampaign>(
    MAILING_CAMPAIGN_STORAGE_KEY,
    getEmptyMailingCampaign(),
  );

  const isSending = ref(false);
  const isTesting = ref(false);
  const totalToSend = ref(0);

  const results = computed<MailingSendResult[]>(() => campaign.value.results);

  const hasCampaign = computed(() => results.value.length > 0);

  const processedCount = computed(() => results.value.length);

  const sentCount = computed(
    () => results.value.filter((result) => result.status === 'sent').length,
  );

  const failedResults = computed(() =>
    results.value.filter((result) => result.status === 'failed'),
  );

  /**
   * Отправляет одну пачку и возвращает строки отчёта. Ошибка запроса целиком
   * превращается в неудачные строки — рассылка на этом останавливается.
   *
   * @param letter письмо рассылки
   * @param recipients получатели пачки
   */
  async function sendChunk(
    letter: MailingLetter,
    recipients: MailingRequestRecipient[],
  ): Promise<{ results: MailingSendResult[]; isFatal: boolean }> {
    try {
      const response = await $fetch(MAILING_SEND_API_PATH, {
        method: 'POST',
        body: {
          subject: letter.subject,
          bodyText: letter.bodyText,
          rewardTier: letter.rewardTier,
          label: letter.label || undefined,
          recipients,
        },
      });

      return {
        results: mailingSendResponseSchema.parse(response).results,
        isFatal: false,
      };
    } catch (error) {
      const message = getRequestErrorMessage(error, CHUNK_FAILURE_MESSAGE);

      return {
        results: recipients.map((recipient) => ({
          email: recipient.email,
          code: recipient.code ?? null,
          status: 'failed' as const,
          error: message,
        })),
        isFatal: true,
      };
    }
  }

  /**
   * Прогоняет получателей пачками, дописывая отчёт по мере отправки.
   *
   * @param letter письмо рассылки
   * @param recipients получатели
   * @param initialResults уже готовые строки отчёта (при повторе неудачных)
   */
  async function run(
    letter: MailingLetter,
    recipients: MailingRequestRecipient[],
    initialResults: MailingSendResult[],
  ): Promise<void> {
    isSending.value = true;
    totalToSend.value = recipients.length + initialResults.length;

    campaign.value = {
      ...letter,
      startedAt: new Date().toISOString(),
      results: initialResults,
    };

    let stoppedMessage: string | null = null;

    for (const batch of chunk(recipients, MAILING_CHUNK_SIZE)) {
      const chunkResult = await sendChunk(letter, batch);

      campaign.value = {
        ...campaign.value,
        results: [...campaign.value.results, ...chunkResult.results],
      };

      if (chunkResult.isFatal) {
        stoppedMessage = chunkResult.results[0]?.error ?? CHUNK_FAILURE_MESSAGE;

        break;
      }
    }

    isSending.value = false;

    if (stoppedMessage) {
      toast.add({
        title: 'Рассылка остановлена',
        description: stoppedMessage,
        color: 'error',
      });

      return;
    }

    const failedCount = failedResults.value.length;

    toast.add({
      title: failedCount
        ? 'Рассылка завершена с ошибками'
        : 'Рассылка завершена',
      description: failedCount
        ? `Отправлено: ${sentCount.value}, не удалось: ${failedCount}`
        : `Отправлено писем: ${sentCount.value}`,
      color: failedCount ? 'warning' : 'success',
    });
  }

  /**
   * Запускает новую рассылку: каждому адресу — свой код и своё письмо.
   *
   * @param form состояние формы рассылки
   * @param emails адреса получателей
   */
  async function send(form: MailingFormState, emails: string[]): Promise<void> {
    await run(
      {
        subject: form.subject,
        bodyText: form.bodyText,
        rewardTier: form.rewardTier,
        label: form.label,
      },
      emails.map((email) => ({ email })),
      [],
    );
  }

  /**
   * Повторяет отправку неудачных строк тем же письмом, что ушло в рассылке
   * (а не текущим черновиком). Уже выпущенный код переиспользуется — второй код
   * на тот же адрес не выпускается.
   */
  async function retryFailed(): Promise<void> {
    const failed = failedResults.value;

    if (!failed.length) {
      return;
    }

    const succeeded = results.value.filter(
      (result) => result.status === 'sent',
    );

    await run(
      {
        subject: campaign.value.subject,
        bodyText: campaign.value.bodyText,
        rewardTier: campaign.value.rewardTier,
        label: campaign.value.label,
      },
      failed.map((result) => ({
        email: result.email,
        code: result.code ?? undefined,
      })),
      succeeded,
    );
  }

  /**
   * Отправляет пробное письмо с кодом-образцом: реальный код не выпускается.
   *
   * @param form состояние формы рассылки
   * @param email адрес для проверки
   */
  async function sendTest(
    form: MailingFormState,
    email: string,
  ): Promise<void> {
    isTesting.value = true;

    try {
      await $fetch(MAILING_TEST_API_PATH, {
        method: 'POST',
        body: {
          subject: form.subject,
          bodyText: form.bodyText,
          email,
        },
      });

      toast.add({
        title: 'Тестовое письмо отправлено',
        description: `Проверьте почту ${email}`,
        color: 'success',
      });
    } catch (error) {
      toast.add({
        title: 'Не удалось отправить тестовое письмо',
        description: getRequestErrorMessage(
          error,
          'Проверьте настройки SMTP и адрес',
        ),
        color: 'error',
      });
    } finally {
      isTesting.value = false;
    }
  }

  /** Очищает отчёт последней рассылки. */
  function clearCampaign(): void {
    campaign.value = getEmptyMailingCampaign();
    totalToSend.value = 0;
  }

  return {
    campaign,
    results,
    hasCampaign,
    processedCount,
    totalToSend,
    sentCount,
    failedResults,
    isSending,
    isTesting,
    send,
    retryFailed,
    sendTest,
    clearCampaign,
  };
}
