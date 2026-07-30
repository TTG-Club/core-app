<script setup lang="ts">
  import type { AbilityKey, Character } from '../../model';

  import { useCharacterSheetList } from '../../composables';
  import {
    ABILITY_LABELS,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    CUSTOM_BONUS_MAX,
    CUSTOM_BONUS_MIN,
    CUSTOM_INITIATIVE_BONUS_HINT,
    CUSTOM_PROFICIENCY_BONUS_HINT,
    DEFAULT_WEAPON_ATTACK_ABILITY,
    getFormattedBonus,
    getProficiencyBonus,
    SHEET_SETTINGS_LABELS,
    SHEET_SETTINGS_TABS,
    SHEET_SETTINGS_WEAPON_TAB,
    WEAPON_ATTACK_ABILITY_AUTO,
    WEAPON_ATTACK_ABILITY_AUTO_HINT,
    WEAPON_ATTACK_ABILITY_OPTIONS,
    WEAPON_ATTACK_FINESSE_HINT,
  } from '../../model';

  // Модалка открывается и из шапки листа, и из карточки списка, поэтому
  // персонаж приходит пропом, а сохранение идёт через список: он сам решает,
  // писать в открытый лист (его допишет автосейв) или отправить документ на бэк.
  const props = defineProps<{
    character: Character;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { saveSettings } = useCharacterSheetList();

  const draftWeaponAbility = ref<
    AbilityKey | typeof WEAPON_ATTACK_ABILITY_AUTO
  >(props.character.settings.weaponAttackAbility ?? WEAPON_ATTACK_ABILITY_AUTO);

  const draftProficiencyBonus = ref(
    props.character.settings.customProficiencyBonus,
  );

  const draftInitiativeBonus = ref(
    props.character.settings.customInitiativeBonus,
  );

  /**
   * Подпись модификатора характеристики: название и значение — одинаково в
   * разборе атаки и инициативы.
   *
   * @param ability ключ характеристики.
   * @returns подпись модификатора характеристики.
   */
  function getAbilityModifierLabel(ability: AbilityKey): string {
    return `${ABILITY_LABELS[ability]} · ${getFormattedBonus(
      getModifier(props.character.abilities[ability]),
    )}`;
  }

  const isWeaponAbilityAuto = computed(
    () => draftWeaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO,
  );

  // Эффективная характеристика черновика: явная либо характеристика по
  // правилам. Сравнение инлайн (а не через isWeaponAbilityAuto) — чтобы TS
  // сузил тип до AbilityKey.
  const effectiveWeaponAbility = computed<AbilityKey>(() =>
    draftWeaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO
      ? DEFAULT_WEAPON_ATTACK_ABILITY
      : draftWeaponAbility.value,
  );

  const levelProficiencyBonus = computed(() =>
    getProficiencyBonus(props.character.level),
  );

  const formattedLevelProficiencyBonus = computed(() =>
    getFormattedBonus(levelProficiencyBonus.value),
  );

  // Итоги считаются от черновика, а не от сохранённых настроек: числа в модалке
  // меняются сразу, ещё до «Применить».
  const proficiencyBonus = computed(
    () => levelProficiencyBonus.value + draftProficiencyBonus.value,
  );

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(proficiencyBonus.value),
  );

  const weaponAbilityModifier = computed(() =>
    getModifier(props.character.abilities[effectiveWeaponAbility.value]),
  );

  const weaponAbilityModifierLabel = computed(() =>
    getAbilityModifierLabel(effectiveWeaponAbility.value),
  );

  const formattedWeaponAttackBonus = computed(() =>
    getFormattedBonus(proficiencyBonus.value + weaponAbilityModifier.value),
  );

  // Фехтовальное и дальнобойное оружие настройка не затрагивает — показываем
  // его бонус рядом, чтобы разница правил была видна сразу.
  const formattedFinesseAttackBonus = computed(() =>
    getFormattedBonus(
      proficiencyBonus.value + getModifier(props.character.abilities.dexterity),
    ),
  );

  const dexterityModifier = computed(() =>
    getModifier(props.character.abilities.dexterity),
  );

  const dexterityModifierLabel = computed(() =>
    getAbilityModifierLabel('dexterity'),
  );

  const formattedInitiativeBonus = computed(() =>
    getFormattedBonus(dexterityModifier.value + draftInitiativeBonus.value),
  );

  const isSaving = ref(false);

  async function handleApply() {
    isSaving.value = true;

    const saved = await saveSettings(props.character, {
      weaponAttackAbility:
        draftWeaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO
          ? null
          : draftWeaponAbility.value,
      customProficiencyBonus: draftProficiencyBonus.value,
      customInitiativeBonus: draftInitiativeBonus.value,
    });

    isSaving.value = false;

    // Ошибку показывает тостом список — модалку оставляем открытой, чтобы
    // введённый выбор не потерялся.
    if (saved) {
      emit('close');
    }
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="SHEET_SETTINGS_LABELS.title">
    <template #body>
      <UTabs
        :items="SHEET_SETTINGS_TABS"
        :default-value="SHEET_SETTINGS_WEAPON_TAB"
        :ui="{ root: 'flex flex-col gap-4' }"
      >
        <template #weapon-attack>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_LABELS.weaponAbilityTitle }}
              </span>

              <USelect
                v-model="draftWeaponAbility"
                :items="WEAPON_ATTACK_ABILITY_OPTIONS"
                class="w-48"
              />
            </div>

            <p
              v-if="isWeaponAbilityAuto"
              class="text-xs text-dimmed"
            >
              {{ WEAPON_ATTACK_ABILITY_AUTO_HINT }}
            </p>

            <div class="grid grid-cols-2 gap-3">
              <div
                class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
              >
                <span
                  class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  {{ SHEET_SETTINGS_LABELS.normalWeaponTitle }}
                </span>

                <span class="text-2xl leading-none font-bold text-highlighted">
                  {{ formattedWeaponAttackBonus }}
                </span>
              </div>

              <div
                class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
              >
                <span
                  class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  {{ SHEET_SETTINGS_LABELS.finesseWeaponTitle }}
                </span>

                <span class="text-2xl leading-none font-bold text-highlighted">
                  {{ formattedFinesseAttackBonus }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_LABELS.abilityModifierTitle }}
              </span>

              <span class="text-toned">{{ weaponAbilityModifierLabel }}</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_LABELS.proficiencyBonusTitle }}
              </span>

              <span class="text-toned">{{ formattedProficiencyBonus }}</span>
            </div>

            <p class="text-xs text-dimmed">
              {{ SHEET_SETTINGS_LABELS.attackFormulaHint }}
              {{ WEAPON_ATTACK_FINESSE_HINT }}
            </p>
          </div>
        </template>

        <template #custom-bonuses>
          <div class="flex flex-col gap-3">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ SHEET_SETTINGS_LABELS.proficiencyBonusTitle }}
            </h3>

            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_LABELS.customBonusTitle }}
              </span>

              <UInputNumber
                v-model="draftProficiencyBonus"
                :min="CUSTOM_BONUS_MIN"
                :max="CUSTOM_BONUS_MAX"
                :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
                class="w-48"
              />
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_LABELS.levelProficiencyBonusTitle }}
              </span>

              <span class="text-toned">
                {{ formattedLevelProficiencyBonus }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_LABELS.totalProficiencyBonusTitle }}
              </span>

              <span class="font-semibold text-highlighted">
                {{ formattedProficiencyBonus }}
              </span>
            </div>

            <p class="text-xs text-dimmed">
              {{ CUSTOM_PROFICIENCY_BONUS_HINT }}
            </p>

            <USeparator class="my-1" />

            <h3 class="text-sm font-semibold text-highlighted">
              {{ SHEET_SETTINGS_LABELS.initiativeTitle }}
            </h3>

            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_LABELS.customBonusTitle }}
              </span>

              <UInputNumber
                v-model="draftInitiativeBonus"
                :min="CUSTOM_BONUS_MIN"
                :max="CUSTOM_BONUS_MAX"
                :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
                class="w-48"
              />
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_LABELS.abilityModifierTitle }}
              </span>

              <span class="text-toned">{{ dexterityModifierLabel }}</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_LABELS.totalInitiativeTitle }}
              </span>

              <span class="font-semibold text-highlighted">
                {{ formattedInitiativeBonus }}
              </span>
            </div>

            <p class="text-xs text-dimmed">
              {{ CUSTOM_INITIATIVE_BONUS_HINT }}
            </p>
          </div>
        </template>
      </UTabs>
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
          :loading="isSaving"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
