<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    getCharacterProficiencyBonus,
    getClassSpellcastingAbility,
    getFormattedBonus,
    SPELL_SAVE_DC_BASE,
    SPELLCASTING_ABILITY_AUTO,
    SPELLCASTING_ABILITY_OPTIONS,
    SPELLCASTING_STAT_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSpellcasting } = useCharacterSheet();

  const draftAbility = ref<AbilityKey | typeof SPELLCASTING_ABILITY_AUTO>(
    character.value.spellcasting.ability ?? SPELLCASTING_ABILITY_AUTO,
  );

  // Характеристика, определяемая по классу (для режима «Авто»).
  const autoAbility = computed(() =>
    getClassSpellcastingAbility(character.value.characterClass),
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
      ? getModifier(character.value.abilities[effectiveAbility.value])
      : 0,
  );

  const saveDc = computed(
    () => SPELL_SAVE_DC_BASE + proficiencyBonus.value + abilityModifier.value,
  );

  const attackBonus = computed(
    () => proficiencyBonus.value + abilityModifier.value,
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

  function handleApply() {
    setSpellcasting({
      ability:
        draftAbility.value === SPELLCASTING_ABILITY_AUTO
          ? null
          : draftAbility.value,
      // Подготовленные заклинания и заговоры правят свои модалки — здесь
      // настройки переносятся как есть.
      prepared: character.value.spellcasting.prepared,
      preparedCantrips: character.value.spellcasting.preparedCantrips,
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Заклинательство">
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

        <div class="grid grid-cols-2 gap-3">
          <div
            class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELLCASTING_STAT_LABELS.saveDc.short }}
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
