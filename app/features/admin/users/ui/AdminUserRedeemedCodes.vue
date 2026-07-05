<script setup lang="ts">
  import {
    CODE_LIST_DATE_FORMAT,
    REWARD_TIER_LABELS,
    SUBSCRIPTION_TYPE_LABELS,
  } from '~admin/subscriptions/model';

  import { useUserRedeemedCodes } from '../composables';

  const props = defineProps<{
    username: string;
  }>();

  const { copy } = useCopyAndShare();
  const { format } = useDayjs();

  const { codes, isLoading, load } = useUserRedeemedCodes(() => props.username);

  // Блок постоянный; список кодов грузим при монтировании. Деталь пересобирается
  // по :key="user.id", поэтому onMounted срабатывает заново на каждого пользователя.
  onMounted(load);

  /** Число доп. наград кода (перки + достижения) — для бейджа «+N». */
  function extrasCount(perks: string[], achievements: string[]): number {
    return perks.length + achievements.length;
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Заголовок секции -->
    <div class="flex items-center gap-2">
      <UIcon
        name="tabler:ticket"
        class="h-5 w-5 text-primary"
        aria-hidden="true"
      />

      <span class="text-sm font-medium text-highlighted">
        Активированные коды
      </span>

      <UBadge
        v-if="!isLoading && codes.length"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ codes.length }}
      </UBadge>
    </div>

    <!-- Загрузка -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="tabler:loader-2"
        class="h-5 w-5 animate-spin"
        aria-hidden="true"
      />
      Загрузка…
    </div>

    <!-- Пусто -->
    <p
      v-else-if="!codes.length"
      class="text-sm text-muted"
    >
      Активированных кодов нет
    </p>

    <!-- Список активированных кодов -->
    <div
      v-else
      class="flex flex-col gap-2"
    >
      <div
        v-for="code in codes"
        :key="code.id"
        class="flex flex-col gap-1.5 rounded-lg border border-default bg-elevated/40 px-3 py-2"
      >
        <div class="flex items-center justify-between gap-3">
          <code
            class="cursor-pointer truncate font-mono text-sm text-highlighted transition-colors select-all hover:text-primary"
            title="Нажмите, чтобы скопировать"
            @click.left.exact.prevent="() => copy(code.code)"
          >
            {{ code.code }}
          </code>

          <span
            v-if="code.redeemedAt"
            class="shrink-0 text-xs whitespace-nowrap text-muted"
          >
            {{ format(code.redeemedAt, CODE_LIST_DATE_FORMAT) }}
          </span>
        </div>

        <div
          v-if="
            (code.subscriptionType && code.subscriptionMonths)
            || code.rewardTier
            || extrasCount(code.perks, code.achievements)
          "
          class="flex flex-wrap items-center gap-1.5"
        >
          <UBadge
            v-if="code.subscriptionType && code.subscriptionMonths"
            color="primary"
            variant="subtle"
            size="sm"
          >
            {{ SUBSCRIPTION_TYPE_LABELS[code.subscriptionType] }} ·
            {{ code.subscriptionMonths }} мес.
          </UBadge>

          <UBadge
            v-if="code.rewardTier"
            color="warning"
            variant="subtle"
            size="sm"
          >
            {{ REWARD_TIER_LABELS[code.rewardTier] }}
          </UBadge>

          <UBadge
            v-if="extrasCount(code.perks, code.achievements)"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            +{{ extrasCount(code.perks, code.achievements) }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>
