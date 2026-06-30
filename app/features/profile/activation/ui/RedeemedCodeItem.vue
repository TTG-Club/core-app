<script setup lang="ts">
  import type { MyRedemption } from '../model';

  import { useSubscriptionActivation } from '../composables';
  import {
    REDEMPTION_DATE_FORMAT,
    REWARD_TIER_LABELS,
    SUBSCRIPTION_STATUS_COLORS,
    SUBSCRIPTION_STATUS_LABELS,
    SUBSCRIPTION_TYPE_LABELS,
  } from '../model';
  import RewardLinkRow from './RewardLinkRow.vue';

  const props = defineProps<{
    redemption: MyRedemption;
    defaultOpen?: boolean;
  }>();

  const emit = defineEmits<{
    /** Подписка кода активирована — родителю стоит обновить список. */
    activated: [];
  }>();

  const { format } = useDayjs();
  const { activatingId, activate } = useSubscriptionActivation();

  const subscription = computed(() => props.redemption.subscription);

  const isActivating = computed(
    () => !!subscription.value && activatingId.value === subscription.value.id,
  );

  const canActivate = computed(
    () => subscription.value?.status === 'REGISTERED',
  );

  const tierLabel = computed(() =>
    props.redemption.rewardTier
      ? REWARD_TIER_LABELS[props.redemption.rewardTier]
      : null,
  );

  const redeemedAtLabel = computed(() =>
    props.redemption.redeemedAt
      ? format(props.redemption.redeemedAt, REDEMPTION_DATE_FORMAT)
      : null,
  );

  const hasRewards = computed(() => props.redemption.rewards.length > 0);

  const hasAchievements = computed(
    () => props.redemption.achievements.length > 0,
  );

  const hasContent = computed(
    () => hasRewards.value || hasAchievements.value || !!subscription.value,
  );

  async function onActivate(): Promise<void> {
    if (!subscription.value) {
      return;
    }

    const updated = await activate(subscription.value.id);

    if (updated) {
      emit('activated');
    }
  }
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-default/5">
    <UCollapsible
      :default-open="defaultOpen"
      :ui="{ content: 'px-4 pb-4' }"
    >
      <template #default="{ open }">
        <div
          class="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-hover"
        >
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                v-if="tierLabel"
                color="warning"
                variant="subtle"
                size="sm"
              >
                {{ tierLabel }}
              </UBadge>

              <UBadge
                v-if="subscription"
                :color="SUBSCRIPTION_STATUS_COLORS[subscription.status]"
                variant="subtle"
                size="sm"
              >
                Подписка: {{ SUBSCRIPTION_STATUS_LABELS[subscription.status] }}
              </UBadge>

              <span
                v-if="!tierLabel && !subscription"
                class="text-sm font-medium text-highlighted"
              >
                Награды
              </span>
            </div>

            <span class="truncate font-mono text-xs text-muted">
              {{ redemption.code }}
              <template v-if="redeemedAtLabel">
                · {{ redeemedAtLabel }}
              </template>
            </span>
          </div>

          <UIcon
            name="tabler:chevron-down"
            class="h-5 w-5 shrink-0 text-muted transition-transform duration-150"
            :class="open ? '-rotate-180' : ''"
            aria-hidden="true"
          />
        </div>
      </template>

      <template #content>
        <div class="space-y-4 pt-1">
          <!-- Подписка кода: активация / срок -->
          <div
            v-if="subscription"
            class="flex flex-col gap-2 rounded-lg border border-default bg-elevated/40 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0 text-sm">
              <p class="font-medium text-highlighted">
                Подписка · {{ SUBSCRIPTION_TYPE_LABELS[subscription.type] }} ·
                {{ subscription.durationMonths }} мес.
              </p>

              <p
                v-if="
                  subscription.status === 'ACTIVE' && subscription.expiresAt
                "
                class="text-xs text-muted"
              >
                Активна до
                {{ format(subscription.expiresAt, REDEMPTION_DATE_FORMAT) }}
              </p>

              <p
                v-else-if="
                  subscription.status === 'EXPIRED' && subscription.expiresAt
                "
                class="text-xs text-error"
              >
                Истекла
                {{ format(subscription.expiresAt, REDEMPTION_DATE_FORMAT) }}
              </p>

              <p
                v-else-if="canActivate"
                class="text-xs text-muted"
              >
                Запустите отсчёт, когда будете готовы пользоваться
              </p>
            </div>

            <UButton
              v-if="canActivate"
              icon="tabler:player-play"
              color="primary"
              size="sm"
              :loading="isActivating"
              class="shrink-0 self-start sm:self-auto"
              @click.left.exact.prevent="onActivate"
            >
              Активировать подписку
            </UButton>
          </div>

          <!-- Награды со ссылками -->
          <div
            v-if="hasRewards"
            class="space-y-2"
          >
            <div class="text-xs font-medium tracking-wide text-muted uppercase">
              Награды и загрузки
            </div>

            <div class="flex flex-col gap-2">
              <RewardLinkRow
                v-for="reward in redemption.rewards"
                :key="reward.perk"
                :reward="reward"
              />
            </div>
          </div>

          <!-- Достижения -->
          <div
            v-if="hasAchievements"
            class="space-y-2"
          >
            <div class="text-xs font-medium tracking-wide text-muted uppercase">
              Достижения
            </div>

            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="achievement in redemption.achievements"
                :key="achievement"
                color="success"
                variant="subtle"
                size="sm"
              >
                {{ achievement }}
              </UBadge>
            </div>
          </div>

          <p
            v-if="!hasContent"
            class="text-sm text-muted"
          >
            По этому коду нет загрузок.
          </p>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
