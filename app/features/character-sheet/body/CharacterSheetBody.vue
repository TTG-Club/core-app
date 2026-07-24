<script setup lang="ts">
  import type {
    AbilityKey,
    ProficiencyGroupKey,
    SavingThrowRow,
    SkillRow,
  } from '../model';

  import {
    useCharacterSheet,
    useCharacterSheetSaveStatus,
  } from '../composables';
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
    SheetBackgroundWizardModal,
    SheetClassResourcesModal,
    SheetClassResourcesPanel,
    SheetClassWizardModal,
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

  // Тело листа переиспользуется в трёх контекстах: отдельная страница, drawer
  // (стандартный режим) и правая панель (широкий режим). «Закрыть» и
  // «развернуть» решает контейнер — тело лишь эмитит события. В drawer крестик
  // даёт стандартная шапка UiDrawer, поэтому свой скрывается через `canClose`.
  const { canExpand = false, canClose = true } = defineProps<{
    canExpand?: boolean;
    canClose?: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
    expand: [];
  }>();

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

  // Статус автосохранения пишет автосейв контейнера (страница/панель/drawer),
  // тело листа лишь показывает его в шапке.
  const saveStatus = useCharacterSheetSaveStatus();

  // Блок из двух колонок нужен в двух местах: в широком контейнере — как левая
  // часть сетки, в узком (<1024px) — внутри первой вкладки «Основное». Единое
  // определение через reusable-template держит обработчики здесь и не плодит
  // дубли разметки.
  //
  // Адаптив считаем по ширине КОНТЕЙНЕРА, а не вьюпорта: в узком drawer/панели
  // лист должен сворачиваться в один столбец, даже когда окно шире 1024px
  // (иначе внутри drawer остаётся десктопная сетка и всё сжимается).
  // До первого измерения контейнера (ширина 0) ориентируемся на вьюпорт —
  // так полноэкранная страница не мигает компактной раскладкой при загрузке.
  const { isDesktop } = useBreakpoints();
  const rootRef = ref<HTMLElement | null>(null);
  const { width: rootWidth } = useElementSize(rootRef);

  const isWide = computed(() =>
    rootWidth.value > 0 ? rootWidth.value >= 1024 : isDesktop.value,
  );

  // Синхронизация высоты правой колонки (характеристики + вкладки) с левой
  // сводкой. Grid-трек `1fr` не ограничивает высоту в auto-высотном контейнере,
  // поэтому длинный список заклинаний раздувал бы блок. Меряем высоту левой
  // колонки и ряда характеристик и явно ограничиваем блок вкладок = левая −
  // характеристики − зазор; список внутри скроллится. Только в широком режиме.
  const leftColumnRef = ref<HTMLElement | null>(null);
  const abilitiesRef = ref<HTMLElement | null>(null);
  const { height: leftColumnHeight } = useElementSize(leftColumnRef);
  const { height: abilitiesHeight } = useElementSize(abilitiesRef);

  const RIGHT_COLUMN_GAP = 16;

  const tabsStyle = computed(() => {
    if (!isWide.value || leftColumnHeight.value <= 0) {
      return undefined;
    }

    const maxHeight = Math.max(
      0,
      Math.round(
        leftColumnHeight.value - abilitiesHeight.value - RIGHT_COLUMN_GAP,
      ),
    );

    return { maxHeight: `${maxHeight}px` };
  });

  const [DefineSummary, ReuseSummary] = createReusableTemplate();

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

  const classWizardModal = overlay.create(SheetClassWizardModal);

  const backgroundWizardModal = overlay.create(SheetBackgroundWizardModal);

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

  function handleClassEdit() {
    if (!ensureEditable()) {
      return;
    }

    classWizardModal.open();
  }

  function handleBackgroundEdit() {
    if (!ensureEditable()) {
      return;
    }

    backgroundWizardModal.open();
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

  /** Закрытие листа — конкретное действие определяет контейнер. */
  function handleClose() {
    emit('close');
  }

  /** Запрос открыть лист на отдельной странице (из drawer или панели). */
  function handleExpand() {
    emit('expand');
  }
</script>

<template>
  <div
    ref="rootRef"
    class="@container mx-auto flex w-full max-w-350 flex-col gap-4"
  >
    <SheetHeader
      :character="character"
      :locked="isLocked"
      :can-expand="canExpand"
      :can-close="canClose"
      :save-status="saveStatus"
      @close="handleClose"
      @expand="handleExpand"
      @edit-background="handleBackgroundEdit"
      @edit-class="handleClassEdit"
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

    <DefineSummary>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-4">
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

        <div class="flex flex-col gap-4">
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
      </div>
    </DefineSummary>

    <div
      class="grid grid-cols-1 gap-4 @5xl:grid-cols-12 @5xl:grid-rows-[min-content_1fr]"
    >
      <div
        ref="abilitiesRef"
        class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-1"
      >
        <SheetAbilitiesRow
          :rows="abilityRows"
          @roll="handleAbilityRoll"
          @settings="handleAbilityEdit"
        />
      </div>

      <div
        v-if="isWide"
        ref="leftColumnRef"
        class="@5xl:col-span-6 @5xl:col-start-1 @5xl:row-span-2 @5xl:row-start-1 @5xl:self-start"
      >
        <ReuseSummary />
      </div>

      <SheetInventoryTabs
        :currency="character.currency"
        :inventory="character.inventory"
        :total-weight="totalWeight"
        :carrying-capacity="carryingCapacity"
        :features="character.features"
        :spells="character.spells"
        :has-main-tab="!isWide"
        :style="tabsStyle"
        class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-2 @5xl:min-h-0"
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
      >
        <template #main>
          <ReuseSummary />
        </template>
      </SheetInventoryTabs>
    </div>
  </div>
</template>
