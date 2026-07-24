<script setup lang="ts">
  import type { AbilityKey, Character } from '../../model';

  import { useCharacterSheetList } from '../../composables';
  import {
    ABILITY_LABELS,
    DEFAULT_WEAPON_ATTACK_ABILITY,
    getFormattedBonus,
    getProficiencyBonus,
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

  const proficiencyBonus = computed(() =>
    getProficiencyBonus(props.character.level),
  );

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(proficiencyBonus.value),
  );

  const weaponAbilityModifier = computed(() =>
    getModifier(props.character.abilities[effectiveWeaponAbility.value]),
  );

  const weaponAbilityModifierLabel = computed(
    () =>
      `${ABILITY_LABELS[effectiveWeaponAbility.value]} · ${getFormattedBonus(
        weaponAbilityModifier.value,
      )}`,
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

  const isSaving = ref(false);

  async function handleApply() {
    isSaving.value = true;

    const saved = await saveSettings(props.character, {
      weaponAttackAbility:
        draftWeaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO
          ? null
          : draftWeaponAbility.value,
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
  <UModal title="Настройки листа">
    <template #body>
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-highlighted">Атака оружием</h3>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Базовая характеристика</span>

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

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4 text-sm">
          <span class="text-toned">Модификатор характеристики</span>

          <span class="text-toned">{{ weaponAbilityModifierLabel }}</span>
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
              class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Обычное оружие
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
              Фехтовальное и дальнобойное
            </span>

            <span class="text-2xl leading-none font-bold text-highlighted">
              {{ formattedFinesseAttackBonus }}
            </span>
          </div>
        </div>

        <p class="text-xs text-dimmed">
          Бонус атаки = бонус мастерства + модификатор характеристики.
          {{ WEAPON_ATTACK_FINESSE_HINT }}
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
          :loading="isSaving"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
