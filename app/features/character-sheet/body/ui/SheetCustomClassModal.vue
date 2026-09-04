<script setup lang="ts">
  import type { AbilityKey, CustomFeatureDraft } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { CasterType } from '~classes/model';
  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_OPTIONS,
    buildCustomClassFeatures,
    buildCustomClassUrl,
    CUSTOM_CLASS_CASTER_TYPE_OPTIONS,
    CUSTOM_CLASS_DEFAULT_HIT_DIE,
    CUSTOM_CLASS_FEATURE_NAME_MAX_LENGTH,
    CUSTOM_CLASS_LABELS,
    CUSTOM_CLASS_NAME_MAX_LENGTH,
    getOwnedSkillHints,
    HIT_DIE_OPTIONS,
    SKILL_DUPLICATE_WARNING,
    toNamedPickerOptions,
    toSelectedAbilityKeys,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';

  const emit = defineEmits<{
    /** `true` — свой класс применён к листу. */
    close: [isCreated?: boolean];
  }>();

  const { character, setClass } = useCharacterSheet();

  const draftName = ref('');

  const draftSubclassName = ref('');

  const draftHitDie = ref(CUSTOM_CLASS_DEFAULT_HIT_DIE);

  const draftSavingThrows = ref<AbilityKey[]>([]);

  const draftSkills = ref<string[]>([]);

  // Тип заклинательства хранится явным `NONE`, а не null: по null лист
  // определяет прогрессию ячеек по названию класса, и свой класс с названием
  // каталожного получил бы чужие ячейки.
  const draftCasterType = ref<CasterType>(CasterType.NONE);

  const draftFeatures = ref<CustomFeatureDraft[]>([]);

  const skillNames = computed(() =>
    character.value.skills.map((skill) => skill.name),
  );

  const ownedSkillHints = computed(() =>
    getOwnedSkillHints(character.value.skills),
  );

  const skillPickerOptions = computed(() =>
    toNamedPickerOptions(skillNames.value, ownedSkillHints.value),
  );

  const isApplyDisabled = computed(() => !draftName.value.trim());

  function handleSavingThrows(value: unknown): void {
    draftSavingThrows.value = toSelectedAbilityKeys(value);
  }

  function handleCasterType(value: unknown): void {
    const option = CUSTOM_CLASS_CASTER_TYPE_OPTIONS.find(
      (casterTypeOption) => casterTypeOption.value === value,
    );

    draftCasterType.value = option?.value ?? CasterType.NONE;
  }

  function handleAddFeature() {
    draftFeatures.value = [
      ...draftFeatures.value,
      { id: crypto.randomUUID(), name: '', description: '' },
    ];
  }

  function handleRemoveFeature(featureId: string) {
    draftFeatures.value = draftFeatures.value.filter(
      (feature) => feature.id !== featureId,
    );
  }

  function handleApply() {
    const name = draftName.value.trim();

    if (!name) {
      return;
    }

    const subclassName = draftSubclassName.value.trim();

    setClass({
      characterClass: {
        url: buildCustomClassUrl(),
        name,
        // Свой класс собирается основным и берёт весь уровень персонажа: его
        // уровень поднимают в окне опыта, как и у каталожного.
        level: character.value.characterClass?.level ?? character.value.level,
        // Ссылки на раздел у своего подкласса нет: он остаётся только названием
        // в шапке листа.
        subclassUrl: null,
        subclassName: subclassName || null,
        casterType: draftCasterType.value,
        hitDie: draftHitDie.value,
        // Названия своего класса в карте заклинательных характеристик нет —
        // игрок задаёт её на вкладке заклинаний.
        spellcastingAbility: null,
        // Число подготовленных заклинаний и заговоров свой класс не считает:
        // таблицы у него нет, и на вкладке заклинаний оно задаётся вручную.
        preparedSpells: [],
        preparedCantrips: [],
      },
      savingThrows: draftSavingThrows.value,
      hitDie: draftHitDie.value,
      // Владения бронёй, оружием и инструментами свой класс не выдаёт: они
      // отмечаются на панели владений листа.
      proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
      skills: { proficient: draftSkills.value, expertise: [] },
      // Ресурсы класса заводятся на панели ресурсов: таблицы, из которой их
      // выводит мастер каталога, у своего класса нет.
      classResources: [],
      features: buildCustomClassFeatures(draftFeatures.value, name),
      // Стартового набора у своего класса нет — снаряжение собирается на
      // вкладке «Снаряжение». Набор прошлого класса при этом снимается.
      startingEquipment: null,
    });

    emit('close', true);
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="CUSTOM_CLASS_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_CLASS_LABELS.nameTitle }}
          </span>

          <UInput
            v-model="draftName"
            :maxlength="CUSTOM_CLASS_NAME_MAX_LENGTH"
            :placeholder="CUSTOM_CLASS_LABELS.namePlaceholder"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_CLASS_LABELS.subclassTitle }}
          </span>

          <UInput
            v-model="draftSubclassName"
            :maxlength="CUSTOM_CLASS_NAME_MAX_LENGTH"
            :placeholder="CUSTOM_CLASS_LABELS.subclassPlaceholder"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_CLASS_LABELS.hitDieTitle }}
          </span>

          <USelect
            v-model="draftHitDie"
            :items="HIT_DIE_OPTIONS"
            class="sm:w-64"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_CLASS_LABELS.savingThrowsTitle }}
          </span>

          <USelectMenu
            :model-value="draftSavingThrows"
            :items="ABILITY_OPTIONS"
            :placeholder="CUSTOM_CLASS_LABELS.savingThrowsPlaceholder"
            label-key="label"
            value-key="value"
            multiple
            @update:model-value="handleSavingThrows"
          />
        </div>

        <SheetChoicePickerField
          v-model="draftSkills"
          :title="CUSTOM_CLASS_LABELS.skillsTitle"
          :explanation="CUSTOM_CLASS_LABELS.skillsPlaceholder"
          :options="skillPickerOptions"
          :warning="SKILL_DUPLICATE_WARNING"
        />

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_CLASS_LABELS.casterTypeTitle }}
          </span>

          <USelect
            :model-value="draftCasterType"
            :items="CUSTOM_CLASS_CASTER_TYPE_OPTIONS"
            @update:model-value="handleCasterType"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ CUSTOM_CLASS_LABELS.featuresTitle }}
            </span>

            <UButton
              :label="CUSTOM_CLASS_LABELS.featureAdd"
              icon="tabler:plus"
              color="neutral"
              variant="subtle"
              size="xs"
              @click.left.exact.prevent="handleAddFeature"
            />
          </div>

          <div
            v-for="feature in draftFeatures"
            :key="feature.id"
            class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <div class="flex items-center gap-2">
              <UInput
                v-model="feature.name"
                :maxlength="CUSTOM_CLASS_FEATURE_NAME_MAX_LENGTH"
                :placeholder="CUSTOM_CLASS_LABELS.featureNamePlaceholder"
                class="min-w-0 grow"
              />

              <UTooltip :text="CUSTOM_CLASS_LABELS.featureRemove">
                <UButton
                  icon="tabler:trash"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="shrink-0"
                  :aria-label="CUSTOM_CLASS_LABELS.featureRemove"
                  @click.left.exact.prevent="handleRemoveFeature(feature.id)"
                />
              </UTooltip>
            </div>

            <MarkupEditor
              v-model="feature.description"
              :placeholder="CUSTOM_CLASS_LABELS.featureDescriptionPlaceholder"
            />
          </div>

          <span
            v-if="!draftFeatures.length"
            class="text-sm text-dimmed italic"
          >
            {{ CUSTOM_CLASS_LABELS.featuresEmpty }}
          </span>
        </div>

        <span class="text-xs text-muted">
          {{ CUSTOM_CLASS_LABELS.hint }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="CUSTOM_CLASS_LABELS.apply"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
