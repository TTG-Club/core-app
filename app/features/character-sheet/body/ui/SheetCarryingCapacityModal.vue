<script setup lang="ts">
  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    CARRYING_CAPACITY_BONUS_MAX,
    CARRYING_CAPACITY_BONUS_MIN,
    CARRYING_CAPACITY_LABELS,
    CARRYING_CAPACITY_MAX,
    CARRYING_CAPACITY_MIN,
    CARRYING_CAPACITY_SIZE_AUTO,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    getCarryingCapacityBreakdown,
    getCarryingCapacityMultiplierLabel,
    getCarryingCapacitySizeOptions,
    WEIGHT_UNIT_LABEL,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setCarryingCapacity } = useCharacterSheet();

  const draftSize = ref<string | null>(character.value.carryingCapacity.size);

  const draftCustom = ref(character.value.carryingCapacity.custom !== null);

  const draftBonus = ref(character.value.carryingCapacity.bonus);

  // Своё значение заводится от расчёта по правилам: игроку чаще нужно поправить
  // предел, а не набирать его с нуля. Округляем, потому что хранится оно целым,
  // а у Крошечного расчёт даёт половину фунта.
  const draftValue = ref(
    character.value.carryingCapacity.custom
      ?? Math.round(getCarryingCapacityBreakdown(character.value).ruleValue),
  );

  const sizeOptions = computed(() =>
    getCarryingCapacitySizeOptions(character.value.size),
  );

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
  // лист, — расхождению правил взяться негде.
  const draftCharacter = computed(() => ({
    ...character.value,
    carryingCapacity: {
      size: draftSize.value,
      custom: draftCustom.value ? toFieldValue(draftValue.value) : null,
      bonus: toFieldValue(draftBonus.value),
    },
  }));

  const breakdown = computed(() =>
    getCarryingCapacityBreakdown(draftCharacter.value),
  );

  const sizeValue = computed(
    () => draftSize.value ?? CARRYING_CAPACITY_SIZE_AUTO,
  );

  const sizeMultiplierLabel = computed(() =>
    getCarryingCapacityMultiplierLabel(breakdown.value.sizeMultiplier),
  );

  /**
   * Выбор размера для подсчёта: вариант «как у персонажа» хранится в записи
   * листа как `null` — иначе размер застыл бы на том, что стоял при настройке.
   *
   * @param value значение выбранного варианта.
   */
  function handleSize(value: unknown): void {
    const selectedOption = sizeOptions.value.find(
      (option) => option.value === value,
    );

    if (!selectedOption) {
      return;
    }

    draftSize.value =
      selectedOption.value === CARRYING_CAPACITY_SIZE_AUTO
        ? null
        : selectedOption.value;
  }

  function handleApply() {
    setCarryingCapacity({
      size: draftSize.value,
      custom: draftCustom.value ? draftValue.value : null,
      bonus: draftBonus.value,
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="CARRYING_CAPACITY_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <UCheckbox
          v-model="draftCustom"
          :label="CARRYING_CAPACITY_LABELS.customToggle"
          :description="CARRYING_CAPACITY_LABELS.customToggleHint"
        />

        <USeparator class="my-1" />

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ CARRYING_CAPACITY_LABELS.valueTitle }}
          </span>

          <UInputNumber
            v-model="draftValue"
            :min="CARRYING_CAPACITY_MIN"
            :max="CARRYING_CAPACITY_MAX"
            class="w-40"
          />
        </div>

        <template v-else>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">
              {{ CARRYING_CAPACITY_LABELS.sizeTitle }}
            </span>

            <USelect
              :model-value="sizeValue"
              :items="sizeOptions"
              class="w-56"
              @update:model-value="handleSize"
            />
          </div>

          <p class="text-xs text-dimmed">
            {{ CARRYING_CAPACITY_LABELS.ruleHint }}
            {{ CARRYING_CAPACITY_LABELS.sizeHint }}
          </p>
        </template>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ CARRYING_CAPACITY_LABELS.bonusTitle }}
          </span>

          <UInputNumber
            v-model="draftBonus"
            :min="CARRYING_CAPACITY_BONUS_MIN"
            :max="CARRYING_CAPACITY_BONUS_MAX"
            :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
            class="w-40"
          />
        </div>

        <p class="text-xs text-dimmed">
          {{ CARRYING_CAPACITY_LABELS.bonusHint }}
        </p>

        <USeparator class="my-1" />

        <!-- Разбор расчёта по правилам: со своим значением показывать нечего —
          там предел и есть введённое число -->
        <template v-if="!breakdown.custom">
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">{{ ABILITY_LABELS.strength }}</span>

            <span class="text-toned">{{ breakdown.strength }}</span>
          </div>

          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">
              {{ CARRYING_CAPACITY_LABELS.sizeBonusTitle }}
            </span>

            <span class="text-toned">{{ sizeMultiplierLabel }}</span>
          </div>

          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">
              {{ CARRYING_CAPACITY_LABELS.ruleTitle }}
            </span>

            <span class="text-toned">{{ breakdown.ruleValue }}</span>
          </div>
        </template>

        <div
          v-if="breakdown.bonus !== 0"
          class="flex items-center justify-between gap-4 text-sm"
        >
          <span class="text-toned">
            {{ CARRYING_CAPACITY_LABELS.bonusRowTitle }}
          </span>

          <span class="text-toned">{{
            getFormattedBonus(breakdown.bonus)
          }}</span>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">
            {{ CARRYING_CAPACITY_LABELS.totalTitle }}
          </span>

          <span class="text-xl font-bold text-highlighted">
            {{ breakdown.value }} {{ WEIGHT_UNIT_LABEL }}
          </span>
        </div>
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
