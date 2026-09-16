<script setup lang="ts">
  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    ATTUNEMENT_BASE_OPTIONS,
    ATTUNEMENT_BASE_RULE,
    ATTUNEMENT_BONUS_MAX,
    ATTUNEMENT_BONUS_MIN,
    ATTUNEMENT_LABELS,
    ATTUNEMENT_MAX,
    ATTUNEMENT_MIN,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    getAttunementBreakdown,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setAttunement } = useCharacterSheet();

  const savedBreakdown = getAttunementBreakdown(character.value);

  const draftCustom = ref(savedBreakdown.custom);

  const draftAbility = ref(savedBreakdown.ability);

  const draftBonus = ref(savedBreakdown.bonus);

  // Своё число заводится от посчитанного предела: игроку чаще нужно поправить
  // его, а не набирать с нуля.
  const draftValue = ref(savedBreakdown.value);

  /**
   * Введённое число для предпросмотра: очищенное поле отдаёт NaN, а в разборе
   * он расползся бы по всем числам. В документ значения уходят через экшен —
   * он клампит их той же подстраховкой.
   *
   * @param value значение поля ввода.
   * @returns число поля.
   */
  function toFieldValue(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  // Персонаж черновика: предел предпросмотра считается той же утилитой, что и
  // плитка снаряжения, — расхождению правил взяться негде.
  const breakdown = computed(() =>
    getAttunementBreakdown({
      ...character.value,
      attunement: {
        custom: draftCustom.value ? toFieldValue(draftValue.value) : null,
        ability: draftAbility.value,
        bonus: toFieldValue(draftBonus.value),
      },
    }),
  );

  const baseValue = computed(() => draftAbility.value ?? ATTUNEMENT_BASE_RULE);

  const formattedBonus = computed(() =>
    getFormattedBonus(breakdown.value.bonus),
  );

  const countHint = computed(
    () => `${ATTUNEMENT_LABELS.countHint}: ${breakdown.value.count}`,
  );

  /**
   * Выбор основы предела: правило 2024 хранится в записи листа как `null` —
   * иначе предел застыл бы на числе, которое стояло при настройке.
   *
   * @param value значение выбранного варианта.
   */
  function handleBase(value: unknown): void {
    const selectedOption = ATTUNEMENT_BASE_OPTIONS.find(
      (option) => option.value === value,
    );

    if (!selectedOption) {
      return;
    }

    draftAbility.value =
      selectedOption.value === ATTUNEMENT_BASE_RULE
        ? null
        : selectedOption.value;
  }

  function handleApply() {
    setAttunement({
      custom: draftCustom.value ? draftValue.value : null,
      ability: draftAbility.value,
      bonus: draftBonus.value,
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="ATTUNEMENT_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <UCheckbox
          v-model="draftCustom"
          :label="ATTUNEMENT_LABELS.customToggle"
          :description="ATTUNEMENT_LABELS.customToggleHint"
        />

        <USeparator class="my-1" />

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ATTUNEMENT_LABELS.valueTitle }}
          </span>

          <UInputNumber
            v-model="draftValue"
            :min="ATTUNEMENT_MIN"
            :max="ATTUNEMENT_MAX"
            class="w-40"
          />
        </div>

        <template v-else>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">
              {{ ATTUNEMENT_LABELS.baseTitle }}
            </span>

            <USelect
              :model-value="baseValue"
              :items="ATTUNEMENT_BASE_OPTIONS"
              class="w-56"
              @update:model-value="handleBase"
            />
          </div>

          <p class="text-xs text-dimmed">
            {{ ATTUNEMENT_LABELS.ruleHint }} {{ ATTUNEMENT_LABELS.abilityHint }}
          </p>

          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">
              {{ ATTUNEMENT_LABELS.bonusTitle }}
            </span>

            <UInputNumber
              v-model="draftBonus"
              :min="ATTUNEMENT_BONUS_MIN"
              :max="ATTUNEMENT_BONUS_MAX"
              :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
              class="w-40"
            />
          </div>

          <p class="text-xs text-dimmed">
            {{ ATTUNEMENT_LABELS.bonusHint }}
          </p>
        </template>

        <USeparator class="my-1" />

        <!-- Разбор подсчёта: со своим числом показывать нечего — там предел и
          есть введённое число -->
        <template v-if="!breakdown.custom">
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">
              {{ ATTUNEMENT_LABELS.baseRowTitle }}
            </span>

            <span class="text-toned">{{ breakdown.baseValue }}</span>
          </div>

          <div
            v-if="breakdown.bonus !== 0"
            class="flex items-center justify-between gap-4 text-sm"
          >
            <span class="text-toned">
              {{ ATTUNEMENT_LABELS.bonusRowTitle }}
            </span>

            <span class="text-toned">{{ formattedBonus }}</span>
          </div>
        </template>

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">{{ ATTUNEMENT_LABELS.totalTitle }}</span>

          <span class="text-xl font-bold text-highlighted">
            {{ breakdown.value }}
          </span>
        </div>

        <p class="text-xs text-dimmed">
          {{ countHint }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
