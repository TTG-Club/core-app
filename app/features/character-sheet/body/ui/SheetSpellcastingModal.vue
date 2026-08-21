<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    getAbilityModifier,
    getCharacterClasses,
    getCharacterProficiencyBonus,
    getClassSpellcastingAbility,
    getFormattedBonus,
    getSpellAttackBonus,
    getSpellSaveDc,
    SPELL_SAVE_DC_BASE,
    SPELLCASTING_ABILITY_AUTO,
    SPELLCASTING_ABILITY_OPTIONS,
    SPELLCASTING_MODAL_TITLE,
    SPELLCASTING_STAT_LABELS,
  } from '../../model';

  const { classUrl } = defineProps<{
    /** Класс, чью заклинательную характеристику настраивают. */
    classUrl: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSpellcastingAbility } = useCharacterSheet();

  /** Настраиваемый класс: у мультикласса характеристика своя у каждого. */
  const targetClass = computed(
    () =>
      getCharacterClasses(character.value).find(
        (entry) => entry.url === classUrl,
      ) ?? null,
  );

  /**
   * Начальное значение селектора: заданная игроком характеристика класса либо
   * «Авто». Вынесено в функцию — читать `.value` computed'а прямо в корне setup
   * нельзя (`vue/no-ref-object-reactivity-loss`).
   *
   * @returns значение селектора характеристики.
   */
  function getInitialAbility(): AbilityKey | typeof SPELLCASTING_ABILITY_AUTO {
    return targetClass.value?.spellcastingAbility ?? SPELLCASTING_ABILITY_AUTO;
  }

  const draftAbility = ref<AbilityKey | typeof SPELLCASTING_ABILITY_AUTO>(
    getInitialAbility(),
  );

  // Характеристика, определяемая по названию класса (для режима «Авто»).
  const autoAbility = computed(() =>
    targetClass.value
      ? getClassSpellcastingAbility({
          ...targetClass.value,
          spellcastingAbility: null,
        })
      : null,
  );

  const isAuto = computed(
    () => draftAbility.value === SPELLCASTING_ABILITY_AUTO,
  );

  // Эффективная характеристика черновика: явная либо класс-производная.
  // Сравнение инлайн (а не через isAuto) — чтобы TS сузил тип до AbilityKey.
  const effectiveAbility = computed<AbilityKey | null>(() =>
    draftAbility.value === SPELLCASTING_ABILITY_AUTO
      ? autoAbility.value
      : draftAbility.value,
  );

  const autoAbilityLabel = computed(() =>
    autoAbility.value ? ABILITY_LABELS[autoAbility.value] : 'не определена',
  );

  const proficiencyBonus = computed(() =>
    getCharacterProficiencyBonus(character.value),
  );

  const abilityModifier = computed(() =>
    effectiveAbility.value
      ? getAbilityModifier(character.value, effectiveAbility.value)
      : 0,
  );

  // Жезл боевого мага и прочая магия прибавляют к заклинательству: подсчёт
  // общий с вкладкой заклинаний, иначе предпросмотр модалки разошёлся бы с ней.
  const saveDc = computed(() =>
    getSpellSaveDc(
      character.value,
      proficiencyBonus.value,
      abilityModifier.value,
    ),
  );

  const attackBonus = computed(() =>
    getSpellAttackBonus(
      character.value,
      proficiencyBonus.value,
      abilityModifier.value,
    ),
  );

  const abilityModifierLabel = computed(() => {
    if (!effectiveAbility.value) {
      return 'Характеристика не определена';
    }

    return `${ABILITY_LABELS[effectiveAbility.value]} · ${getFormattedBonus(
      abilityModifier.value,
    )}`;
  });

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(proficiencyBonus.value),
  );

  const formattedAttackBonus = computed(() =>
    getFormattedBonus(attackBonus.value),
  );

  // У мультикласса окно открывается на конкретный класс — его и подписываем.
  const modalTitle = computed(() =>
    targetClass.value
      ? `${SPELLCASTING_MODAL_TITLE}: ${targetClass.value.name}`
      : SPELLCASTING_MODAL_TITLE,
  );

  function handleApply() {
    setSpellcastingAbility(
      classUrl,
      draftAbility.value === SPELLCASTING_ABILITY_AUTO
        ? null
        : draftAbility.value,
    );

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="modalTitle">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Характеристика</span>

          <USelect
            v-model="draftAbility"
            :items="SPELLCASTING_ABILITY_OPTIONS"
            class="w-48"
          />
        </div>

        <p
          v-if="isAuto"
          class="text-xs text-dimmed"
        >
          Определяется по классу: {{ autoAbilityLabel }}
        </p>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4 text-sm">
          <span class="text-toned">Модификатор характеристики</span>

          <span class="text-toned">{{ abilityModifierLabel }}</span>
        </div>

        <div class="flex items-center justify-between gap-4 text-sm">
          <span class="text-toned">Бонус мастерства</span>

          <span class="text-toned">{{ formattedProficiencyBonus }}</span>
        </div>

        <USeparator class="my-1" />

        <!-- Итоговые числа: подписи берём полные — плитки модалки широкие, а
          подсказки по наведению у них нет, и расшифровать сокращение негде -->
        <div class="grid grid-cols-2 gap-3">
          <div
            class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELLCASTING_STAT_LABELS.saveDc.full }}
            </span>

            <span class="text-2xl leading-none font-bold text-highlighted">
              {{ saveDc }}
            </span>
          </div>

          <div
            class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELLCASTING_STAT_LABELS.attack.full }}
            </span>

            <span class="text-2xl leading-none font-bold text-highlighted">
              {{ formattedAttackBonus }}
            </span>
          </div>
        </div>

        <p class="text-xs text-dimmed">
          Сложность спасброска = {{ SPELL_SAVE_DC_BASE }} + бонус мастерства +
          модификатор характеристики. Бонус атаки — то же без базового значения.
        </p>
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
