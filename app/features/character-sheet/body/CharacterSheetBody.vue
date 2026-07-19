<script setup lang="ts">
  import type { AbilityKey, SavingThrowRow, SkillRow } from '../model';

  import { useCharacterSheet } from '../composables';
  import { ABILITY_LABELS } from '../model';
  import {
    SheetAbilitiesRow,
    SheetAbilityModal,
    SheetClassResourcesPanel,
    SheetExperienceModal,
    SheetHeader,
    SheetHealthModal,
    SheetHealthPanel,
    SheetInventoryTabs,
    SheetNameModal,
    SheetProficienciesPanel,
    SheetRollModal,
    SheetSavingThrowsPanel,
    SheetSkillsPanel,
    SheetSpeedModal,
    SheetSpeedTile,
    SheetStatTile,
    SheetVisionModal,
  } from './ui';

  const {
    character,
    abilityRows,
    savingThrowRows,
    skillRows,
    formattedProficiencyBonus,
    formattedInitiative,
    totalWeight,
    carryingCapacity,
    toggleSavingThrowProficiency,
    cycleSkillProficiency,
  } = useCharacterSheet();

  const overlay = useOverlay();

  // Без destroyOnClose: закрытый оверлей удаляется из реестра useOverlay,
  // и повторный open() бросает «Overlay not found». Компонент модалки и так
  // размонтируется после закрытия, поэтому черновики сбрасываются.
  const abilityModal = overlay.create(SheetAbilityModal, {
    props: {
      abilityKey: 'strength',
    },
  });

  const speedModal = overlay.create(SheetSpeedModal);

  const healthModal = overlay.create(SheetHealthModal);

  const nameModal = overlay.create(SheetNameModal);

  const visionModal = overlay.create(SheetVisionModal);

  const rollModal = overlay.create(SheetRollModal, {
    props: {
      title: '',
      modifier: 0,
    },
  });

  const experienceModal = overlay.create(SheetExperienceModal);

  function handleAbilityEdit(abilityKey: AbilityKey) {
    abilityModal.open({ abilityKey });
  }

  function handleAbilityRoll(abilityKey: AbilityKey) {
    rollModal.open({
      title: `Проверка: ${ABILITY_LABELS[abilityKey]}`,
      modifier: getModifier(character.value.abilities[abilityKey]),
    });
  }

  function handleSpeedEdit() {
    speedModal.open();
  }

  function handleHealthEdit() {
    healthModal.open();
  }

  function handleNameEdit() {
    nameModal.open();
  }

  function handleProgressEdit() {
    experienceModal.open();
  }

  function handleInitiativeRoll() {
    rollModal.open({
      title: 'Инициатива',
      modifier: getModifier(character.value.abilities.dexterity),
      actionLabel: 'Бросить инициативу',
    });
  }

  function handleSavingThrowRoll(row: SavingThrowRow) {
    rollModal.open({
      title: `Спасбросок: ${ABILITY_LABELS[row.key]}`,
      modifier: row.value,
      actionLabel: 'Бросить спасбросок',
    });
  }

  function handleSkillRoll(row: SkillRow) {
    rollModal.open({
      title: `Проверка: ${row.name}`,
      modifier: row.value,
    });
  }

  function handleVisionEdit() {
    visionModal.open();
  }
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
    <SheetHeader
      :character="character"
      @edit-name="handleNameEdit"
      @edit-progress="handleProgressEdit"
      @edit-vision="handleVisionEdit"
    />

    <div class="relative flex items-center justify-center py-1">
      <div
        class="h-px w-full bg-linear-to-r from-transparent via-warning/40 to-transparent"
      />

      <div class="absolute size-2 rotate-45 border border-warning bg-default" />
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div class="flex flex-col gap-4 lg:col-span-3">
        <div class="grid grid-cols-2 gap-4">
          <SheetStatTile
            label="Мастерство"
            :value="formattedProficiencyBonus"
          />

          <SheetStatTile
            label="Класс доспеха"
            :value="character.armorClass"
          />
        </div>

        <SheetHealthPanel
          :health="character.health"
          :hit-dice="character.hitDice"
          :extra-hit-dice="character.extraHitDice"
          @edit="handleHealthEdit"
        />

        <SheetSavingThrowsPanel
          :rows="savingThrowRows"
          @roll="handleSavingThrowRoll"
          @toggle="toggleSavingThrowProficiency"
        />

        <SheetProficienciesPanel :proficiencies="character.proficiencies" />
      </div>

      <div class="flex flex-col gap-4 lg:col-span-3">
        <div class="grid grid-cols-2 gap-4">
          <SheetSpeedTile
            :speed="character.speed"
            @edit="handleSpeedEdit"
          />

          <SheetStatTile
            label="Инициатива"
            :value="formattedInitiative"
            interactive
            @press="handleInitiativeRoll"
          />
        </div>

        <SheetClassResourcesPanel :resources="character.classResources" />

        <SheetSkillsPanel
          :rows="skillRows"
          class="grow"
          @cycle="cycleSkillProficiency"
          @roll="handleSkillRoll"
        />
      </div>

      <div class="flex flex-col gap-4 lg:col-span-6">
        <SheetAbilitiesRow
          :rows="abilityRows"
          @roll="handleAbilityRoll"
          @settings="handleAbilityEdit"
        />

        <SheetInventoryTabs
          :currency="character.currency"
          :inventory="character.inventory"
          :total-weight="totalWeight"
          :carrying-capacity="carryingCapacity"
        />
      </div>
    </div>
  </div>
</template>
