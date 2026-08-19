<script setup lang="ts">
  import type {
    AbilityKey,
    Character,
    CharacterCustomBonus,
    CustomBonusBaseSource,
    ProficiencyBaseSource,
  } from '../../model';

  import { useCharacterSheetList } from '../../composables';
  import {
    ABILITY_LABELS,
    CUSTOM_BONUS_BASE_SOURCE_OPTIONS,
    CUSTOM_BONUS_FLAT_SOURCE,
    CUSTOM_INITIATIVE_BONUS_HINT,
    CUSTOM_PROFICIENCY_BONUS_HINT,
    DEFAULT_INITIATIVE_ABILITY,
    DEFAULT_WEAPON_ATTACK_ABILITY,
    EXHAUSTION_LABELS,
    getAbilityModifier,
    getCustomBonusesValue,
    getExhaustionD20Penalty,
    getFormattedBonus,
    getProficiencyBonus,
    PROFICIENCY_BASE_LEVEL_SOURCE,
    PROFICIENCY_BASE_OPTIONS,
    PROFICIENCY_BONUS_SOURCE_OPTIONS,
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

  const levelProficiencyBonus = computed(() =>
    getProficiencyBonus(props.character.level),
  );

  // Характеристика инициативы нужна и черновику, и его источнику, поэтому
  // считается до них: чтение `.value` у ref в том же месте теряет реактивность.
  const initialInitiativeAbility =
    props.character.settings.initiativeAbility ?? DEFAULT_INITIATIVE_ABILITY;

  // Черновики основы держат источник и своё число врозь: у бонусов ровно так же
  // — переключение источника не теряет введённое, пока игрок примеряет основу.
  const draftProficiencyBaseSource = ref<ProficiencyBaseSource>(
    props.character.settings.customProficiencyBase === null
      ? PROFICIENCY_BASE_LEVEL_SOURCE
      : CUSTOM_BONUS_FLAT_SOURCE,
  );

  // Своё число заводится от значения по правилам: игроку чаще нужно поправить
  // его на единицу-другую, а не набирать с нуля.
  const draftProficiencyBaseValue = ref(
    props.character.settings.customProficiencyBase
      ?? getProficiencyBonus(props.character.level),
  );

  // Характеристика инициативы живёт отдельно от источника: со своим числом
  // выбранная характеристика ждёт возврата к ней.
  const draftInitiativeAbility = ref<AbilityKey>(initialInitiativeAbility);

  const draftInitiativeBaseSource = ref<CustomBonusBaseSource>(
    props.character.settings.customInitiativeBase === null
      ? initialInitiativeAbility
      : CUSTOM_BONUS_FLAT_SOURCE,
  );

  const draftInitiativeBaseValue = ref(
    props.character.settings.customInitiativeBase
      ?? getAbilityModifier(props.character, initialInitiativeAbility),
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
      getAbilityModifier(props.character, ability),
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

  // Источник основы инициативы и выбранная характеристика ходят парой: выбор
  // характеристики запоминается, чтобы своё число не стирало её насовсем.
  const initiativeBaseSource = computed<CustomBonusBaseSource>({
    get: () => draftInitiativeBaseSource.value,
    set: (source) => {
      draftInitiativeBaseSource.value = source;

      if (source !== CUSTOM_BONUS_FLAT_SOURCE) {
        draftInitiativeAbility.value = source;
      }
    },
  });

  const isProficiencyBaseCustom = computed(
    () => draftProficiencyBaseSource.value === CUSTOM_BONUS_FLAT_SOURCE,
  );

  const isInitiativeBaseCustom = computed(
    () => draftInitiativeBaseSource.value === CUSTOM_BONUS_FLAT_SOURCE,
  );

  /**
   * Введённое своё значение основы: очищенное поле отдаёт NaN, а в плитках он
   * расползся бы по всем числам раздела.
   *
   * @param value значение поля ввода.
   * @returns значение основы.
   */
  function toBaseValue(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  // Итоги считаются от черновика, а не от сохранённых настроек: числа в модалке
  // меняются сразу, ещё до «Применить».
  const proficiencyBase = computed(() =>
    isProficiencyBaseCustom.value
      ? toBaseValue(draftProficiencyBaseValue.value)
      : levelProficiencyBonus.value,
  );

  const initiativeBase = computed(() =>
    isInitiativeBaseCustom.value
      ? toBaseValue(draftInitiativeBaseValue.value)
      : getAbilityModifier(props.character, draftInitiativeAbility.value),
  );

  // Истощение снимает своё с инициативы уже на листе — в разборе оно стоит
  // отдельной плиткой, иначе итог настроек разошёлся бы с плиткой листа.
  const exhaustionPenalty = computed(() =>
    getExhaustionD20Penalty(props.character),
  );

  const customProficiencyBonus = computed(() =>
    getCustomBonusesValue(props.character, draftProficiencyBonuses.value),
  );

  const proficiencyBonus = computed(
    () => proficiencyBase.value + customProficiencyBonus.value,
  );

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(proficiencyBonus.value),
  );

  const weaponAbilityModifier = computed(() =>
    getAbilityModifier(props.character, effectiveWeaponAbility.value),
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
      proficiencyBonus.value + getAbilityModifier(props.character, 'dexterity'),
    ),
  );

  const isSaving = ref(false);

  async function handleApply() {
    isSaving.value = true;

    const saved = await saveSettings(props.character, {
      weaponAttackAbility:
        draftWeaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO
          ? null
          : draftWeaponAbility.value,
      // Основа по правилам хранится как `null`: иначе своё число застыло бы
      // на бонусе того уровня, на котором его вписали.
      customProficiencyBase: isProficiencyBaseCustom.value
        ? draftProficiencyBaseValue.value
        : null,
      // Ловкость — характеристика инициативы по правилам, поэтому в документ
      // она уходит тем же `null`, что и у листов без настройки.
      initiativeAbility:
        draftInitiativeAbility.value === DEFAULT_INITIATIVE_ABILITY
          ? null
          : draftInitiativeAbility.value,
      customInitiativeBase: isInitiativeBaseCustom.value
        ? draftInitiativeBaseValue.value
        : null,
      // Группировку навыков задаёт своя модалка настройки навыков — здесь она
      // идёт насквозь, чтобы сохранение настроек её не сбрасывало.
      groupSkillsByAbility: props.character.settings.groupSkillsByAbility,
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
              v-model:base-source="draftProficiencyBaseSource"
              v-model:base-custom-value="draftProficiencyBaseValue"
              :character="character"
              :title="SHEET_SETTINGS_LABELS.proficiencyBonusTitle"
              :base-items="PROFICIENCY_BASE_OPTIONS"
              :source-items="PROFICIENCY_BONUS_SOURCE_OPTIONS"
              :base-value="proficiencyBase"
              :total-label="SHEET_SETTINGS_LABELS.totalProficiencyBonusTitle"
              :hint="CUSTOM_PROFICIENCY_BONUS_HINT"
            />

            <USeparator />

            <SheetCustomBonusSection
              v-model="draftInitiativeBonuses"
              v-model:base-source="initiativeBaseSource"
              v-model:base-custom-value="draftInitiativeBaseValue"
              :character="character"
              :title="SHEET_SETTINGS_LABELS.initiativeTitle"
              :base-items="CUSTOM_BONUS_BASE_SOURCE_OPTIONS"
              :base-value="initiativeBase"
              :penalty-label="EXHAUSTION_LABELS.title"
              :penalty-value="exhaustionPenalty"
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
