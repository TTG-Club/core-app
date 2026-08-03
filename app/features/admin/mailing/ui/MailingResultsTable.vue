<script setup lang="ts">
  import type { MailingCampaign } from '../model';

  import { REWARD_TIER_LABELS } from '~admin/subscriptions/model';

  import {
    getMailingReportText,
    MAILING_DATE_FORMAT,
    MAILING_STATUS_COLORS,
    MAILING_STATUS_LABELS,
  } from '../model';

  const props = defineProps<{
    campaign: MailingCampaign;
    sending?: boolean;
    processedCount: number;
    totalToSend: number;
    sentCount: number;
    failedCount: number;
  }>();

  const emit = defineEmits<{
    retry: [];
    clear: [];
  }>();

  const toast = useToast();
  const { copy } = useClipboard();
  const { format } = useDayjs();

  const startedAtLabel = computed(() =>
    props.campaign.startedAt
      ? format(props.campaign.startedAt, MAILING_DATE_FORMAT)
      : '',
  );

  const tierLabel = computed(
    () => REWARD_TIER_LABELS[props.campaign.rewardTier],
  );

  const summaryColor = computed(() =>
    props.failedCount ? 'warning' : 'success',
  );

  /**
   * Копирует значение в буфер обмена и подтверждает тостом.
   *
   * @param value что копируем
   * @param title заголовок тоста
   */
  async function copyValue(value: string, title: string): Promise<void> {
    await copy(value);

    toast.add({ title, color: 'success' });
  }

  function copyCode(code: string): void {
    copyValue(code, 'Код скопирован');
  }

  function copyReport(): void {
    copyValue(
      getMailingReportText(props.campaign.results),
      'Таблица скопирована',
    );
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:list-check"
            class="size-5 text-primary"
          />

          <h2 class="font-semibold text-highlighted">Результат рассылки</h2>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :color="summaryColor"
            variant="subtle"
            size="sm"
          >
            Отправлено {{ sentCount }} из {{ campaign.results.length }}
          </UBadge>

          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ tierLabel }}
          </UBadge>

          <span
            v-if="startedAtLabel"
            class="text-xs text-muted"
          >
            {{ startedAtLabel }}
          </span>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <UProgress
        v-if="sending"
        :model-value="processedCount"
        :max="totalToSend"
        status
      />

      <div class="flex flex-col gap-2">
        <div
          v-for="result in campaign.results"
          :key="result.email"
          class="flex flex-col gap-1 rounded-lg border border-default px-3 py-2"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-sm text-highlighted">{{ result.email }}</span>

            <div class="flex items-center gap-2">
              <UButton
                v-if="result.code"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="tabler:copy"
                class="font-mono"
                @click.left.exact.prevent="copyCode(result.code)"
              >
                {{ result.code }}
              </UButton>

              <UBadge
                :color="MAILING_STATUS_COLORS[result.status]"
                variant="subtle"
                size="sm"
              >
                {{ MAILING_STATUS_LABELS[result.status] }}
              </UBadge>
            </div>
          </div>

          <p
            v-if="result.error"
            class="text-xs text-error"
          >
            {{ result.error }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="tabler:trash"
          :disabled="sending"
          @click.left.exact.prevent="emit('clear')"
        >
          Очистить
        </UButton>

        <UButton
          v-if="failedCount"
          color="warning"
          variant="soft"
          icon="tabler:refresh"
          :loading="sending"
          @click.left.exact.prevent="emit('retry')"
        >
          Повторить неудачные ({{ failedCount }})
        </UButton>

        <UButton
          icon="tabler:copy"
          :disabled="sending"
          @click.left.exact.prevent="copyReport"
        >
          Скопировать таблицу
        </UButton>
      </div>
    </template>
  </UCard>
</template>
