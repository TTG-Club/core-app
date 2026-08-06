<script setup lang="ts">
  import type {
    AbilityKey,
    Character,
    CharacterCustomBonus,
  } from '../../model';

  import { useCharacterSheetList } from '../../composables';
  import {
    ABILITY_LABELS,
    CUSTOM_INITIATIVE_BONUS_HINT,
    CUSTOM_PROFICIENCY_BONUS_HINT,
    DEFAULT_WEAPON_ATTACK_ABILITY,
    getCustomBonusesValue,
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
  import SheetCustomBonusSection from './SheetCustomBonusSection.vue';

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

  // Строки правятся на месте, поэтому черновик берёт копии записей: пока не
  // нажато «Применить», настройки листа остаются прежними.
  const draftProficiencyBonuses = ref<CharacterCustomBonus[]>(
    props.character.settings.customProficiencyBonuses.map((bonus) => ({
      ...bonus,
    })),
  );

  const draftInitiativeBonuses = ref<CharacterCustomBonus[]>(
    props.character.settings.customInitiativeBonuses.map((bonus) => ({
      ...bonus,
    })),
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

  // Итоги считаются от черновика, а не от сохранённых настроек: числа в модалке
  // меняются сразу, ещё до «Применить».
  const customProficiencyBonus = computed(() =>
    getCustomBonusesValue(props.character, draftProficiencyBonuses.value),
  );

  const proficiencyBonus = computed(
    () => levelProficiencyBonus.value + customProficiencyBonus.value,
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

  const isSaving = ref(false);

  async function handleApply() {
    isSaving.value = true;

    const saved = await saveSettings(props.character, {
      weaponAttackAbility:
        draftWeaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO
          ? null
          : draftWeaponAbility.value,
      // Копии, а не сами черновики: модалка остаётся открытой при ошибке
      // сохранения, и её правки не должны править уже сохранённые настройки.
      customProficiencyBonuses: draftProficiencyBonuses.value.map((bonus) => ({
        ...bonus,
      })),
      customInitiativeBonuses: draftInitiativeBonuses.value.map((bonus) => ({
        ...bonus,
      })),
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
          <div class="flex flex-col gap-4">
            <SheetCustomBonusSection
              v-model="draftProficiencyBonuses"
              :character="character"
              :title="SHEET_SETTINGS_LABELS.proficiencyBonusTitle"
              :base-label="SHEET_SETTINGS_LABELS.levelProficiencyBonusTitle"
              :base-value="levelProficiencyBonus"
              :total-label="SHEET_SETTINGS_LABELS.totalProficiencyBonusTitle"
              :hint="CUSTOM_PROFICIENCY_BONUS_HINT"
            />

            <USeparator />

            <SheetCustomBonusSection
              v-model="draftInitiativeBonuses"
              :character="character"
              :title="SHEET_SETTINGS_LABELS.initiativeTitle"
              :base-label="ABILITY_LABELS.dexterity"
              :base-value="dexterityModifier"
              :total-label="SHEET_SETTINGS_LABELS.totalInitiativeTitle"
              :hint="CUSTOM_INITIATIVE_BONUS_HINT"
            />
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
