<script setup lang="ts">
  import type { MailingHistoryEntry } from '../model';

  import { REWARD_TIER_LABELS } from '~admin/subscriptions/model';

  import { MAILING_DATE_FORMAT } from '../model';

  const props = defineProps<{
    entries: MailingHistoryEntry[];
    loading?: boolean;
    hasError?: boolean;
  }>();

  const emit = defineEmits<{
    refresh: [];
  }>();

  const toast = useToast();
  const { copy } = useClipboard();
  const { format } = useDayjs();

  const search = ref('');

  const filteredEntries = computed(() => {
    const query = search.value.trim().toLowerCase();

    if (!query) {
      return props.entries;
    }

    return props.entries.filter(
      (entry) =>
        entry.email.includes(query)
        || entry.code.toLowerCase().includes(query)
        || (entry.campaign?.toLowerCase().includes(query) ?? false),
    );
  });

  /**
   * Возвращает подпись состояния кода: активирован, деактивирован или ждёт.
   *
   * @param entry строка истории
   */
  function getStatusLabel(entry: MailingHistoryEntry): string {
    if (entry.redeemedBy) {
      return `Активирован: ${entry.redeemedBy}`;
    }

    return entry.disabled ? 'Деактивирован' : 'Не активирован';
  }

  /**
   * Возвращает цвет бейджа состояния кода.
   *
   * @param entry строка истории
   */
  function getStatusColor(
    entry: MailingHistoryEntry,
  ): 'info' | 'error' | 'neutral' {
    if (entry.redeemedBy) {
      return 'info';
    }

    return entry.disabled ? 'error' : 'neutral';
  }

  async function copyCode(code: string): Promise<void> {
    await copy(code);

    toast.add({ title: 'Код скопирован', color: 'success' });
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:history"
            class="size-5 text-primary"
          />

          <h2 class="font-semibold text-highlighted">История рассылок</h2>

          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ entries.length }}
          </UBadge>
        </div>

        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="tabler:refresh"
          :loading="loading"
          @click.left.exact.prevent="emit('refresh')"
        >
          Обновить
        </UButton>
      </div>
    </template>

    <div class="space-y-4">
      <UInput
        v-model="search"
        icon="tabler:search"
        placeholder="Поиск по почте, коду или названию рассылки"
        class="w-full"
      />

      <div
        v-if="loading"
        class="space-y-2"
      >
        <USkeleton
          v-for="index in 4"
          :key="index"
          class="h-12 w-full rounded-lg"
        />
      </div>

      <p
        v-else-if="hasError"
        class="py-6 text-center text-sm text-error"
      >
        Не удалось загрузить выпущенные коды
      </p>

      <div
        v-else-if="filteredEntries.length"
        class="flex flex-col gap-2"
      >
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="flex flex-col gap-1 rounded-lg border border-default px-3 py-2"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-sm text-highlighted">{{ entry.email }}</span>

            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="tabler:copy"
              class="font-mono"
              @click.left.exact.prevent="copyCode(entry.code)"
            >
              {{ entry.code }}
            </UButton>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
            <UBadge
              :color="getStatusColor(entry)"
              variant="subtle"
              size="sm"
            >
              {{ getStatusLabel(entry) }}
            </UBadge>

            <span v-if="entry.rewardTier">
              {{ REWARD_TIER_LABELS[entry.rewardTier] }}
            </span>

            <span v-if="entry.campaign">{{ entry.campaign }}</span>

            <span>{{ format(entry.createdAt, MAILING_DATE_FORMAT) }}</span>
          </div>
        </div>
      </div>

      <p
        v-else
        class="py-6 text-center text-sm text-secondary"
      >
        {{
          entries.length
            ? 'Ничего не найдено'
            : 'Рассылок ещё не было — отправьте первую'
        }}
      </p>
    </div>
  </UCard>
</template>
