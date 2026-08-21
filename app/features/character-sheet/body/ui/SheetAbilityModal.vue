<script setup lang="ts">
  import type {
    AbilityKey,
    Character,
    CharacterCustomBonus,
  } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_BONUS_SOURCE_OPTIONS,
    ABILITY_LABELS,
    ABILITY_SCORE_MAX,
    ABILITY_SCORE_MIN,
    getAbilityScoreHint,
    getEffectiveAbilityScore,
    SHEET_ABILITY_SETTINGS_LABELS,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  const props = defineProps<{
    abilityKey: AbilityKey;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setAbilityBonuses, setAbilityScore } = useCharacterSheet();

  const abilityLabel = computed(() => ABILITY_LABELS[props.abilityKey]);

  const draftScore = ref(character.value.abilities[props.abilityKey]);

  // Черновик правится до «Сохранить»: копируются и сами записи бонусов — иначе
  // правки уходили бы в лист мимо кнопки.
  const draftBonuses = ref<CharacterCustomBonus[]>(
    character.value.abilityBonuses[props.abilityKey].map((bonus) => ({
      ...bonus,
    })),
  );

  // Итоги считаются от черновика, а не от листа: числа в модалке меняются
  // сразу, ещё до «Сохранить».
  const draftCharacter = computed<Character>(() => ({
    ...character.value,
    abilities: {
      ...character.value.abilities,
      [props.abilityKey]: draftScore.value,
    },
    abilityBonuses: {
      ...character.value.abilityBonuses,
      [props.abilityKey]: draftBonuses.value,
    },
  }));

  // Значение с прибавками: от него считается модификатор — иначе он разошёлся
  // бы с плиткой характеристики.
  const totalScore = computed(() =>
    getEffectiveAbilityScore(draftCharacter.value, props.abilityKey),
  );

  const formattedDraftModifier = computed(() =>
    getFormattedModifier(totalScore.value),
  );

  // Разбор нужен, только когда итог разошёлся с записанным значением: у
  // характеристики без прибавок он повторял бы поле ввода.
  const totalHint = computed(() => {
    const hint = getAbilityScoreHint(draftCharacter.value, props.abilityKey);

    return hint
      ? `${SHEET_ABILITY_SETTINGS_LABELS.totalTitle} ${totalScore.value} · ${hint}`
      : '';
  });

  function handleSave() {
    setAbilityScore(props.abilityKey, draftScore.value);
    setAbilityBonuses(props.abilityKey, draftBonuses.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="abilityLabel"
    :description="SHEET_ABILITY_SETTINGS_LABELS.description"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-6">
          <UFormField :label="SHEET_ABILITY_SETTINGS_LABELS.scoreTitle">
            <UInputNumber
              v-model="draftScore"
              :min="ABILITY_SCORE_MIN"
              :max="ABILITY_SCORE_MAX"
              class="w-40"
            />
          </UFormField>

          <div class="flex flex-col items-center gap-1">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SHEET_ABILITY_SETTINGS_LABELS.modifierTitle }}
            </span>

            <span class="text-3xl leading-none font-bold text-highlighted">
              {{ formattedDraftModifier }}
            </span>
          </div>
        </div>

        <!-- Разбор итога: и бонусы предметов, и свои бонусы одной строкой —
          иначе не понять, почему модификатор не сходится с полем значения -->
        <span
          v-if="totalHint"
          class="text-xs text-dimmed"
        >
          {{ totalHint }}
        </span>

        <USeparator />

        <!-- Бонусы разделом, а не карточкой: своя рамка спорила бы с пунктиром
          кнопки «Добавить бонус» внутри него — как в настройке спасбросков -->
        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_ABILITY_SETTINGS_LABELS.bonusesTitle }}
          </span>

          <SheetCustomBonusRows
            v-model="draftBonuses"
            :character="draftCharacter"
            :source-items="ABILITY_BONUS_SOURCE_OPTIONS"
          />

          <p class="text-xs text-dimmed">
            {{ SHEET_ABILITY_SETTINGS_LABELS.bonusesHint }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_ABILITY_SETTINGS_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_ABILITY_SETTINGS_LABELS.save"
          color="primary"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
