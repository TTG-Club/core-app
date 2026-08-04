<script setup lang="ts">
  import type { MailingFormState } from '~admin/mailing/model';
  import type { RedemptionCodeResponse } from '~admin/subscriptions/model';

  import { useMailingCampaign } from '~admin/mailing/composables';
  import {
    getMailingHistory,
    MAILING_HISTORY_DATA_KEY,
    MAILING_PAGE_TITLE,
  } from '~admin/mailing/model';
  import {
    MailingHistoryList,
    MailingLetterForm,
    MailingResultsTable,
  } from '~admin/mailing/ui';
  import { SUBSCRIPTION_CODES_API_PATH } from '~admin/subscriptions/model';

  useSeoMeta({
    title: `${MAILING_PAGE_TITLE}: Настройки`,
  });

  const requestFetch = useRequestFetch();

  // server: false — приватные данные subscriber-service грузим на клиенте, где
  // авторизация (cookie → Bearer → subscriber) гарантированно работает.
  const {
    data: codes,
    status,
    error,
    refresh,
  } = await useAsyncData<RedemptionCodeResponse[]>(
    MAILING_HISTORY_DATA_KEY,
    () => requestFetch(SUBSCRIPTION_CODES_API_PATH),
    { default: () => [], server: false },
  );

  const history = computed(() => getMailingHistory(codes.value ?? []));

  const knownEmails = computed(() => history.value.map((entry) => entry.email));

  const isHistoryLoading = computed(() => status.value === 'pending');

  const hasHistoryError = computed(() => !!error.value);

  const {
    campaign,
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
  } = useMailingCampaign();

  /**
   * Отправляет рассылку и обновляет историю: новые коды должны сразу появиться
   * в списке, чтобы повторная отправка на те же адреса была видна.
   */
  async function handleSubmit(
    form: MailingFormState,
    emails: string[],
  ): Promise<void> {
    await send(form, emails);
    await refresh();
  }

  async function handleTest(
    form: MailingFormState,
    email: string,
  ): Promise<void> {
    await sendTest(form, email);
  }

  async function handleRetry(): Promise<void> {
    await retryFailed();
    await refresh();
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="MAILING_PAGE_TITLE"
  >
    <div class="space-y-6">
      <!-- Форма и отчёт держат состояние в localStorage — только на клиенте. -->
      <ClientOnly>
        <MailingLetterForm
          :sending="isSending"
          :testing="isTesting"
          :known-emails="knownEmails"
          @submit="handleSubmit"
          @test="handleTest"
        />

        <MailingResultsTable
          v-if="hasCampaign"
          :campaign="campaign"
          :sending="isSending"
          :processed-count="processedCount"
          :total-to-send="totalToSend"
          :sent-count="sentCount"
          :failed-count="failedResults.length"
          @retry="handleRetry"
          @clear="clearCampaign"
        />

        <template #fallback>
          <USkeleton class="h-96 w-full rounded-xl" />
        </template>
      </ClientOnly>

      <ClientOnly>
        <MailingHistoryList
          :entries="history"
          :loading="isHistoryLoading"
          :has-error="hasHistoryError"
          @refresh="() => refresh()"
        />

        <template #fallback>
          <USkeleton class="h-64 w-full rounded-xl" />
        </template>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>
