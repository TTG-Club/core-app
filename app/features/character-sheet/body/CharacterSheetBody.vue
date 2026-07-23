<script setup lang="ts">
  import type {
    AbilityKey,
    ProficiencyGroupKey,
    SavingThrowRow,
    SkillRow,
  } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    ABILITY_LABELS,
    ARMOR_PROFICIENCY_GROUPS,
    LANGUAGE_PROFICIENCY_GROUPS,
    TOOL_PROFICIENCY_GROUPS,
  } from '../model';
  import {
    SheetAbilitiesRow,
    SheetAbilityModal,
    SheetArmorClassModal,
    SheetClassResourcesModal,
    SheetClassResourcesPanel,
    SheetExperienceModal,
    SheetFeatAddModal,
    SheetFeatureAddModal,
    SheetHeader,
    SheetHealthModal,
    SheetHealthPanel,
    SheetInventoryTabs,
    SheetItemAddModal,
    SheetMagicItemAddModal,
    SheetNameModal,
    SheetProficienciesPanel,
    SheetProficiencyGroupsModal,
    SheetRollModal,
    SheetSavingThrowsPanel,
    SheetSizeModal,
    SheetSkillsPanel,
    SheetSpeciesWizardModal,
    SheetSpeedModal,
    SheetSpeedTile,
    SheetSpellAddModal,
    SheetStatTile,
    SheetVisionModal,
    SheetWeaponProficienciesModal,
  } from './ui';

  const {
    character,
    isLocked,
    toggleLock,
    ensureEditable,
    abilityRows,
    savingThrowRows,
    skillRows,
    formattedProficiencyBonus,
    formattedInitiative,
    armorClassValue,
    totalWeight,
    carryingCapacity,
    toggleSavingThrowProficiency,
    cycleSkillProficiency,
    adjustClassResource,
    adjustInventoryItemQuantity,
    removeFeature,
    removeInventoryItem,
    removeSpell,
    setFeatureChoice,
    toggleInspiration,
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

  const armorClassModal = overlay.create(SheetArmorClassModal);

  const classResourcesModal = overlay.create(SheetClassResourcesModal);

  const proficiencyGroupsModal = overlay.create(SheetProficiencyGroupsModal, {
    props: {
      title: '',
      target: 'armor',
      groups: [],
    },
  });

  const weaponProficienciesModal = overlay.create(
    SheetWeaponProficienciesModal,
  );

  const speciesWizardModal = overlay.create(SheetSpeciesWizardModal);

  const sizeModal = overlay.create(SheetSizeModal);

  const featureAddModal = overlay.create(SheetFeatureAddModal);

  const featAddModal = overlay.create(SheetFeatAddModal);

  const spellAddModal = overlay.create(SheetSpellAddModal);

  const itemAddModal = overlay.create(SheetItemAddModal);

  const magicItemAddModal = overlay.create(SheetMagicItemAddModal);

  function handleAbilityEdit(abilityKey: AbilityKey) {
    if (!ensureEditable()) {
      return;
    }

    abilityModal.open({ abilityKey });
  }

  function handleAbilityRoll(abilityKey: AbilityKey) {
    rollModal.open({
      title: `Проверка: ${ABILITY_LABELS[abilityKey]}`,
      modifier: getModifier(character.value.abilities[abilityKey]),
    });
  }

  function handleSpeedEdit() {
    if (!ensureEditable()) {
      return;
    }

    speedModal.open();
  }

  function handleHealthEdit() {
    if (!ensureEditable()) {
      return;
    }

    healthModal.open();
  }

  function handleNameEdit() {
    if (!ensureEditable()) {
      return;
    }

    nameModal.open();
  }

  function handleProgressEdit() {
    if (!ensureEditable()) {
      return;
    }

    experienceModal.open();
  }

  function handleArmorClassEdit() {
    if (!ensureEditable()) {
      return;
    }

    armorClassModal.open();
  }

  function handleClassResourcesEdit() {
    if (!ensureEditable()) {
      return;
    }

    classResourcesModal.open();
  }

  function handleProficienciesEdit(group: ProficiencyGroupKey) {
    if (!ensureEditable()) {
      return;
    }

    if (group === 'armor') {
      proficiencyGroupsModal.open({
        title: 'Владение бронёй',
        target: 'armor',
        groups: ARMOR_PROFICIENCY_GROUPS,
      });
    }

    if (group === 'weapons') {
      weaponProficienciesModal.open();
    }

    if (group === 'tools') {
      proficiencyGroupsModal.open({
        title: 'Владение инструментами',
        target: 'tools',
        groups: TOOL_PROFICIENCY_GROUPS,
      });
    }

    if (group === 'languages') {
      proficiencyGroupsModal.open({
        title: 'Владение языками',
        target: 'languages',
        groups: LANGUAGE_PROFICIENCY_GROUPS,
      });
    }
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
    if (!ensureEditable()) {
      return;
    }

    visionModal.open();
  }

  function handleSpeciesEdit() {
    if (!ensureEditable()) {
      return;
    }

    speciesWizardModal.open();
  }

  function handleSizeEdit() {
    if (!ensureEditable()) {
      return;
    }

    sizeModal.open();
  }

  function handleFeatureAdd() {
    if (!ensureEditable()) {
      return;
    }

    featureAddModal.open();
  }

  function handleFeatAdd() {
    if (!ensureEditable()) {
      return;
    }

    featAddModal.open();
  }

  function handleSpellAdd() {
    if (!ensureEditable()) {
      return;
    }

    spellAddModal.open();
  }

  function handleItemAdd() {
    if (!ensureEditable()) {
      return;
    }

    itemAddModal.open();
  }

  function handleMagicItemAdd() {
    if (!ensureEditable()) {
      return;
    }

    magicItemAddModal.open();
  }
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
    <SheetHeader
      :character="character"
      :locked="isLocked"
      @edit-name="handleNameEdit"
      @edit-progress="handleProgressEdit"
      @edit-size="handleSizeEdit"
      @edit-species="handleSpeciesEdit"
      @edit-vision="handleVisionEdit"
      @toggle-inspiration="toggleInspiration"
      @toggle-lock="toggleLock"
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
            :value="armorClassValue"
            interactive
            press-label="Настроить класс доспеха"
            @press="handleArmorClassEdit"
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

        <SheetProficienciesPanel
          :proficiencies="character.proficiencies"
          @edit="handleProficienciesEdit"
        />
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

        <SheetClassResourcesPanel
          :resources="character.classResources"
          @adjust="adjustClassResource"
          @edit="handleClassResourcesEdit"
        />

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
          :features="character.features"
          :spells="character.spells"
          @add-feature="handleFeatureAdd"
          @add-feat="handleFeatAdd"
          @add-item="handleItemAdd"
          @add-magic-item="handleMagicItemAdd"
          @add-spell="handleSpellAdd"
          @adjust-item-quantity="adjustInventoryItemQuantity"
          @edit-choice="setFeatureChoice"
          @remove-feature="removeFeature"
          @remove-item="removeInventoryItem"
          @remove-spell="removeSpell"
        />
      </div>
    </div>
  </div>
</template>
