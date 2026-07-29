<script setup lang="ts">
  import type { CharacterPreparedSpells } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    getFormattedBonus,
    getPreparedSpellsBreakdown,
    PREPARED_SPELLS_BONUS_MAX,
    PREPARED_SPELLS_BONUS_MIN,
    PREPARED_SPELLS_EMPTY_VALUE,
    PREPARED_SPELLS_LABELS,
    PREPARED_SPELLS_MAX,
    PREPARED_SPELLS_MIN,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setPreparedSpells } = useCharacterSheet();

  const savedBreakdown = getPreparedSpellsBreakdown(character.value);

  const draftCustom = ref(savedBreakdown.custom);

  // Своё число: у листа без него отправной точкой служит число класса, чтобы
  // игрок правил его, а не набирал с нуля.
  const draftValue = ref(
    savedBreakdown.value ?? savedBreakdown.classValue ?? PREPARED_SPELLS_MIN,
  );

  const draftBonus = ref(savedBreakdown.bonus);

  const formattedBonus = computed(() => getFormattedBonus(draftBonus.value));

  // Настройка черновика: режим «своё число» и есть отсутствие подсчёта по
  // классу, поэтому в выключенном режиме `custom` равен null.
  const draftPrepared = computed<CharacterPreparedSpells>(() => ({
    custom: draftCustom.value ? draftValue.value : null,
    bonus: draftBonus.value,
  }));

  // Итог считается тем же разбором, что и блок вкладки: черновик подставляется
  // в персонажа, а не пересчитывается формулой заново.
  const draftBreakdown = computed(() =>
    getPreparedSpellsBreakdown({
      ...character.value,
      spellcasting: {
        ...character.value.spellcasting,
        prepared: draftPrepared.value,
      },
    }),
  );

  const totalLabel = computed(() =>
    draftBreakdown.value.value === null
      ? PREPARED_SPELLS_EMPTY_VALUE
      : String(draftBreakdown.value.value),
  );

  // Число класса от черновика не зависит: его меняют только уровень и класс.
  const classValueLabel = computed(() =>
    draftBreakdown.value.classValue === null
      ? PREPARED_SPELLS_EMPTY_VALUE
      : String(draftBreakdown.value.classValue),
  );

  function handleApply() {
    setPreparedSpells(draftPrepared.value);

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="PREPARED_SPELLS_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <UCheckbox
          v-model="draftCustom"
          :label="PREPARED_SPELLS_LABELS.customToggle"
          :description="PREPARED_SPELLS_LABELS.customHint"
        />

        <USeparator class="my-1" />

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ PREPARED_SPELLS_LABELS.customValue }}
          </span>

          <UInputNumber
            v-model="draftValue"
            :min="PREPARED_SPELLS_MIN"
            :max="PREPARED_SPELLS_MAX"
            class="w-40"
          />
        </div>

        <template v-else>
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">
              {{ PREPARED_SPELLS_LABELS.classValue }}
            </span>

            <span class="text-toned">{{ classValueLabel }}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">
              {{ PREPARED_SPELLS_LABELS.bonus }}
            </span>

            <UInputNumber
              v-model="draftBonus"
              :min="PREPARED_SPELLS_BONUS_MIN"
              :max="PREPARED_SPELLS_BONUS_MAX"
              :format-options="{ signDisplay: 'exceptZero' }"
              class="w-40"
            />
          </div>

          <p
            v-if="draftBreakdown.classValue === null"
            class="text-xs text-dimmed"
          >
            {{ PREPARED_SPELLS_LABELS.unknownClassValue }}
          </p>

          <p
            v-else
            class="text-xs text-dimmed"
          >
            {{ PREPARED_SPELLS_LABELS.autoHint }}
          </p>
        </template>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">{{ PREPARED_SPELLS_LABELS.total }}</span>

          <span class="flex items-baseline gap-2">
            <span
              v-if="!draftCustom && draftBonus !== 0"
              class="text-xs text-dimmed"
            >
              {{ classValueLabel }} {{ formattedBonus }}
            </span>

            <span class="text-xl font-bold text-highlighted">
              {{ totalLabel }}
            </span>
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
