<script setup lang="ts">
  import type { CreateCodesFormState, CreateCodesRequest } from '../model';

  import {
    CODES_BATCH_MAX,
    CODES_BATCH_MIN,
    createCodesSchema,
    getInitialCreateCodesForm,
    REWARD_PERK_LABELS,
    REWARD_PERK_OPTIONS,
    REWARD_TIER_OPTIONS,
    SUBSCRIPTION_MONTHS_MAX,
    SUBSCRIPTION_MONTHS_MIN,
    SUBSCRIPTION_TYPE_OPTIONS,
    TIER_SUBSCRIPTION_MONTHS,
    tierCumulativePerks,
    toCreateCodesRequest,
  } from '../model';

  defineProps<{
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [payload: CreateCodesRequest];
  }>();

  const toast = useToast();

  const state = reactive<CreateCodesFormState>(getInitialCreateCodesForm());

  // Кумулятивные перки выбранного тира — подсказка под селектором.
  const tierPerksPreview = computed(() =>
    state.rewardTier
      ? tierCumulativePerks(state.rewardTier).map(
          (perk) => REWARD_PERK_LABELS[perk],
        )
      : [],
  );

  // Срок подписки, зашитый в выбранный тир (0 — тир без подписки или тир не выбран).
  // Бэкенд подставит её автоматически (подарочную), если не задать подписку вручную.
  const tierSubscriptionMonths = computed(() =>
    state.rewardTier ? TIER_SUBSCRIPTION_MONTHS[state.rewardTier] : 0,
  );

  // Тумблер подписки меняет смысл, когда тир уже несёт пресет: это уже «переопределение».
  const subscriptionSwitchLabel = computed(() =>
    tierSubscriptionMonths.value
      ? 'Переопределить подписку тира'
      : 'Добавить подписку',
  );

  const subscriptionSwitchDescription = computed(() =>
    tierSubscriptionMonths.value
      ? `Задать свой срок и тип вместо пресета тира (${tierSubscriptionMonths.value} мес., подарочная).`
      : 'Код зарегистрирует подписку; пользователь активирует её сам.',
  );

  // При включении ручного режима для тира стартуем с его пресета, а не с 1 месяца.
  function onToggleSubscription(value: boolean): void {
    state.includeSubscription = value;

    if (value && tierSubscriptionMonths.value > 0) {
      state.subscriptionMonths = tierSubscriptionMonths.value;
    }
  }

  // Свободный ввод кодов достижений тегами.
  const achievementDraft = ref('');

  function addAchievement(): void {
    const value = achievementDraft.value.trim();

    if (value && !state.achievements.includes(value)) {
      state.achievements.push(value);
    }

    achievementDraft.value = '';
  }

  function removeAchievement(code: string): void {
    const index = state.achievements.indexOf(code);

    if (index !== -1) {
      state.achievements.splice(index, 1);
    }
  }

  function resetForm(): void {
    Object.assign(state, getInitialCreateCodesForm());
    achievementDraft.value = '';
  }

  function onSubmit(): void {
    // Тир необязателен, но код должен нести хотя бы что-то одно.
    const hasContent =
      !!state.rewardTier
      || state.includeSubscription
      || state.perks.length > 0
      || state.achievements.length > 0;

    if (!hasContent) {
      toast.add({
        title: 'Пустой код',
        description: 'Укажите хотя бы тир, подписку, перки или достижения',
        color: 'warning',
      });

      return;
    }

    emit('submit', toCreateCodesRequest(state));
  }
</script>

<template>
  <UForm
    :state="state"
    :schema="createCodesSchema"
    class="space-y-6"
    @submit="onSubmit"
  >
    <!-- Главное: содержимое и партия -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:gift"
            class="size-5 text-primary"
          />

          <h3 class="font-semibold text-highlighted">Содержимое и партия</h3>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField
          label="Тир награды"
          name="rewardTier"
          help="Главное содержимое кода. Тир кумулятивен — включает награды всех нижестоящих тиров."
        >
          <USelectMenu
            v-model="state.rewardTier"
            :items="REWARD_TIER_OPTIONS"
            value-key="value"
            label-key="label"
            placeholder="Без тира"
            class="w-full"
          />
        </UFormField>

        <div
          v-if="state.rewardTier"
          class="space-y-2 rounded-lg border border-default bg-elevated/50 px-3 py-2.5"
        >
          <div
            v-if="tierSubscriptionMonths"
            class="flex flex-wrap items-center gap-1.5"
          >
            <span class="text-xs text-muted">Даёт подписку:</span>

            <UBadge
              color="primary"
              variant="subtle"
              size="sm"
            >
              {{ tierSubscriptionMonths }} мес. · подарочная
            </UBadge>
          </div>

          <div
            v-if="tierPerksPreview.length"
            class="flex flex-wrap items-center gap-1.5"
          >
            <span class="text-xs text-muted">Даёт перки:</span>

            <UBadge
              v-for="perk in tierPerksPreview"
              :key="perk"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ perk }}
            </UBadge>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Количество кодов"
            name="count"
          >
            <UInputNumber
              v-model="state.count"
              :min="CODES_BATCH_MIN"
              :max="CODES_BATCH_MAX"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Метка"
            name="label"
            help="Пометка для админки, в код не попадает."
          >
            <UInput
              v-model="state.label"
              placeholder="Kickstarter, тир 4"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </UCard>

    <!-- Дополнительно: подписка, доп. перки, достижения -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:adjustments"
            class="size-5 text-primary"
          />

          <h3 class="font-semibold text-highlighted">Дополнительно</h3>

          <span class="text-xs text-muted">
            подписка, доп. перки, достижения
          </span>
        </div>
      </template>

      <div class="space-y-5">
        <!-- Подписка -->
        <div class="space-y-3">
          <USwitch
            :model-value="state.includeSubscription"
            :label="subscriptionSwitchLabel"
            :description="subscriptionSwitchDescription"
            @update:model-value="onToggleSubscription"
          />

          <!-- Тир уже несёт подписку, а ручной режим выключен — она уйдёт в код автоматически. -->
          <p
            v-if="tierSubscriptionMonths && !state.includeSubscription"
            class="flex items-start gap-1.5 rounded-lg border border-default bg-elevated/50 px-3 py-2 text-xs text-muted"
          >
            <UIcon
              name="tabler:info-circle"
              class="mt-0.5 size-3.5 shrink-0"
            />

            <span>
              Тир уже даёт подарочную подписку на {{ tierSubscriptionMonths }}
              мес. — она попадёт в код автоматически. Включите тумблер, чтобы
              задать свой срок и тип.
            </span>
          </p>

          <div
            v-if="state.includeSubscription"
            class="grid gap-4 sm:grid-cols-2"
          >
            <UFormField
              label="Тип подписки"
              name="subscriptionType"
            >
              <USelectMenu
                v-model="state.subscriptionType"
                :items="SUBSCRIPTION_TYPE_OPTIONS"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Срок, месяцев"
              name="subscriptionMonths"
            >
              <UInputNumber
                v-model="state.subscriptionMonths"
                :min="SUBSCRIPTION_MONTHS_MIN"
                :max="SUBSCRIPTION_MONTHS_MAX"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Доп. перки помимо тира -->
        <UFormField
          label="Дополнительные перки"
          name="perks"
          help="Выдаются сверх перков тира."
        >
          <USelectMenu
            v-model="state.perks"
            :items="REWARD_PERK_OPTIONS"
            value-key="value"
            label-key="label"
            multiple
            placeholder="Не выбрано"
            class="w-full"
          />
        </UFormField>

        <!-- Достижения -->
        <UFormField
          label="Достижения"
          name="achievements"
          help="Коды достижений; добавляйте по одному."
        >
          <div class="space-y-2">
            <UInput
              v-model="achievementDraft"
              placeholder="Код достижения и Enter"
              class="w-full"
              @keydown.enter.prevent="addAchievement"
            >
              <template #trailing>
                <UButton
                  icon="tabler:plus"
                  color="neutral"
                  variant="link"
                  size="xs"
                  :disabled="!achievementDraft.trim()"
                  @click.left.exact.prevent="addAchievement"
                />
              </template>
            </UInput>

            <div
              v-if="state.achievements.length"
              class="flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="code in state.achievements"
                :key="code"
                color="primary"
                variant="subtle"
                size="sm"
                class="gap-1"
              >
                {{ code }}

                <UIcon
                  name="tabler:x"
                  class="size-3 cursor-pointer"
                  @click.left.exact.prevent="removeAchievement(code)"
                />
              </UBadge>
            </div>
          </div>
        </UFormField>
      </div>
    </UCard>

    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        variant="ghost"
        color="neutral"
        icon="tabler:restore"
        @click.left.exact.prevent="resetForm"
      >
        Сбросить
      </UButton>

      <UButton
        type="submit"
        icon="tabler:ticket"
        :loading="loading"
      >
        Выпустить коды
      </UButton>
    </div>
  </UForm>
</template>
