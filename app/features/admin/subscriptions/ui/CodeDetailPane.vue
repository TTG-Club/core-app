<script setup lang="ts">
  import type { RedemptionCodeResponse } from '../model';

  import { UiDetailPane } from '~ui/detail-pane';

  import { useSubscriptionCodes } from '../composables';
  import {
    CODE_DETAIL_DATE_FORMAT,
    CODE_STATUS_COLORS,
    CODE_STATUS_LABELS,
    getCodeStatus,
    REWARD_PERK_LABELS,
    REWARD_TIER_LABELS,
    SUBSCRIPTION_TYPE_LABELS,
    tierCumulativePerks,
  } from '../model';

  const { code } = defineProps<{
    code: RedemptionCodeResponse;
  }>();

  const emit = defineEmits<{
    close: [];
    updated: [code: RedemptionCodeResponse];
  }>();

  const { copy } = useCopyAndShare();
  const { format } = useDayjs();
  const { updatingId, setCodeDisabled } = useSubscriptionCodes();

  const status = computed(() => getCodeStatus(code));
  const isUpdating = computed(() => updatingId.value === code.id);

  // Кумулятивные награды тира и отдельно «доп. перки» кода (что сверх тира).
  const tierPerks = computed(() =>
    code.rewardTier ? tierCumulativePerks(code.rewardTier) : [],
  );

  const extraPerks = computed(() => {
    const inTier = new Set(tierPerks.value);

    return code.perks.filter((perk) => !inTier.has(perk));
  });

  const hasContent = computed(
    () =>
      !!code.subscriptionMonths
      || !!code.rewardTier
      || code.perks.length > 0
      || code.achievements.length > 0,
  );

  async function onToggleActive(active: boolean): Promise<void> {
    const updated = await setCodeDisabled(code.id, !active);

    if (updated) {
      emit('updated', updated);
    }
  }
</script>

<template>
  <UiDetailPane
    title="Промокод"
    @close="emit('close')"
  >
    <div class="space-y-6">
      <!-- Код + статус (компактно, в две строки) -->
      <div
        class="flex flex-col gap-2 rounded-xl border border-default bg-default/10 p-3"
      >
        <span
          class="cursor-pointer font-mono text-base break-all text-highlighted transition-colors select-all hover:text-primary"
          title="Нажмите, чтобы скопировать"
          @click.left.exact.prevent="() => copy(code.code)"
        >
          {{ code.code }}
        </span>

        <div class="flex items-center justify-between gap-3">
          <UBadge
            :color="CODE_STATUS_COLORS[status]"
            variant="subtle"
            size="sm"
          >
            {{ CODE_STATUS_LABELS[status] }}
          </UBadge>

          <!-- Текст статуса + тумблер деактивации (для непогашенных) -->
          <div
            v-if="!code.redeemedBy"
            class="flex items-center gap-2"
          >
            <span class="text-xs text-muted">
              {{ code.disabled ? 'Деактивирован' : 'Активен' }}
            </span>

            <USwitch
              :model-value="!code.disabled"
              :disabled="isUpdating"
              @update:model-value="onToggleActive"
            />
          </div>
        </div>
      </div>

      <!-- Что входит -->
      <div class="space-y-3">
        <div class="text-xs font-medium tracking-wide text-muted uppercase">
          Что входит
        </div>

        <template v-if="hasContent">
          <!-- Подписка -->
          <div v-if="code.subscriptionType && code.subscriptionMonths">
            <UBadge
              color="primary"
              variant="subtle"
            >
              Подписка: {{ SUBSCRIPTION_TYPE_LABELS[code.subscriptionType] }} ·
              {{ code.subscriptionMonths }} мес.
            </UBadge>
          </div>

          <!-- Тир и его награды отдельным блоком -->
          <div
            v-if="code.rewardTier"
            class="space-y-1.5"
          >
            <UBadge
              color="warning"
              variant="subtle"
            >
              {{ REWARD_TIER_LABELS[code.rewardTier] }}
            </UBadge>

            <div
              v-if="tierPerks.length"
              class="flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="perk in tierPerks"
                :key="perk"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ REWARD_PERK_LABELS[perk] }}
              </UBadge>
            </div>
          </div>

          <!-- Дополнительные перки сверх тира -->
          <div
            v-if="extraPerks.length"
            class="space-y-1.5"
          >
            <div class="text-xs text-muted">Дополнительные перки</div>

            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="perk in extraPerks"
                :key="perk"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ REWARD_PERK_LABELS[perk] }}
              </UBadge>
            </div>
          </div>

          <!-- Достижения -->
          <div
            v-if="code.achievements.length"
            class="space-y-1.5"
          >
            <div class="text-xs text-muted">Достижения</div>

            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="achievement in code.achievements"
                :key="achievement"
                color="success"
                variant="subtle"
                size="sm"
              >
                {{ achievement }}
              </UBadge>
            </div>
          </div>
        </template>

        <p
          v-else
          class="text-sm text-muted"
        >
          —
        </p>
      </div>

      <!-- Метка -->
      <div
        v-if="code.label"
        class="space-y-2"
      >
        <div class="text-xs font-medium tracking-wide text-muted uppercase">
          Метка
        </div>

        <p class="text-sm text-highlighted">
          {{ code.label }}
        </p>
      </div>

      <!-- История -->
      <div class="space-y-2">
        <div class="text-xs font-medium tracking-wide text-muted uppercase">
          История
        </div>

        <div class="space-y-1.5 text-sm">
          <div class="flex flex-wrap gap-x-2">
            <span class="text-muted">Создан:</span>

            <span class="text-highlighted">
              {{ format(code.createdAt, CODE_DETAIL_DATE_FORMAT) }}
            </span>
          </div>

          <div
            v-if="code.redeemedBy"
            class="flex flex-wrap gap-x-2"
          >
            <span class="text-muted">Активирован:</span>

            <span class="text-highlighted">
              {{ code.redeemedBy }}
              <template v-if="code.redeemedAt">
                · {{ format(code.redeemedAt, CODE_DETAIL_DATE_FORMAT) }}
              </template>
            </span>
          </div>

          <div
            v-if="code.disabled"
            class="flex flex-wrap gap-x-2"
          >
            <span class="text-muted">Деактивирован:</span>

            <span class="text-highlighted">
              <template v-if="code.disabledBy">{{ code.disabledBy }}</template>

              <template v-if="code.disabledAt">
                · {{ format(code.disabledAt, CODE_DETAIL_DATE_FORMAT) }}
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </UiDetailPane>
</template>
