<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    FeatChoiceType,
    FeatEditorRows,
    FeatSpellChoiceRow,
  } from '../../model';

  import { isAbilityKey } from '~/shared/types';
  import {
    SelectAbilities,
    SelectClass,
    SelectMagicSchool,
    SelectSpellLevel,
  } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { useFeatRefDirectory } from '../../composable';
  import {
    createSpellChoiceRow,
    FEAT_CASTING_TIME_OPTIONS,
    FEAT_EDITOR_LABELS,
    FEAT_NO_SELECTION,
    FEAT_SPELL_CHOICE_TYPE_OPTIONS,
    getFeatSpellChoiceLabel,
    getSpellListChoiceOptions,
    getTakenChoiceKeys,
    toEntityRefs,
    toEntityRefUrls,
    toUrlList,
    withSpellListChoiceOption,
  } from '../../model';

  /**
   * Выборы, связанные с заклинаниями: какое заклинание игрок берёт, из какого
   * списка класса и от какой характеристики оно считается.
   *
   * Живут рядом с безусловной выдачей: и то, и другое кладёт заклинание в
   * книгу — разница только в том, кто его называет.
   */
  const { rows } = defineProps<{
    /** Все строки редактора: из них берутся занятые ключи выборов. */
    rows: FeatEditorRows;
  }>();

  const model = defineModel<Array<FeatSpellChoiceRow>>({ required: true });

  /** Классы, перечисленные в выборах списка: по ним берутся снимки названий. */
  const classOptionUrls = computed<Array<string>>(() =>
    model.value
      .filter((row) => row.type === 'SPELL_LIST')
      .flatMap((row) => row.options.map((option) => option.value)),
  );

  const { getEntry: getClassEntry } = useFeatRefDirectory(
    'CLASS',
    classOptionUrls,
  );

  /** Ограничивается ли выбор фильтром заклинаний. */
  function isSpellPick(row: FeatSpellChoiceRow): boolean {
    return row.type === 'SPELL' || row.type === 'CANTRIP';
  }

  /**
   * Классы пула ссылками: селект справочника хранит только url, а фильтр —
   * ссылки со снимком.
   *
   * @param row строка выбора.
   * @param urls url выбранных классов.
   */
  function setFilterClasses(
    row: FeatSpellChoiceRow,
    urls: string | Array<string> | undefined,
  ) {
    row.spellFilter.classes = toEntityRefs(toUrlList(urls));
  }

  /**
   * Привязка пула к ответу игрока. «Не привязано» хранится пустой строкой, а
   * селекту нужен непустой признак: пустая строка у `reka-ui` — сброс выбора.
   *
   * @param row строка выбора.
   * @param key значение селекта.
   */
  function setClassesFromChoice(row: FeatSpellChoiceRow, key: string) {
    row.spellFilter.classesFromChoiceKey = key === FEAT_NO_SELECTION ? '' : key;
  }

  /**
   * Время накладывания: у «любого» тот же приём с непустым признаком.
   *
   * @param row строка выбора.
   * @param value значение селекта.
   */
  function setCastingTime(row: FeatSpellChoiceRow, value: string) {
    row.spellFilter.castingTime =
      value === FEAT_NO_SELECTION ? undefined : value;
  }

  /** Варианты привязки к выбору списка класса вместе с пунктом «не привязано». */
  function getChoiceLinkOptions(row: FeatSpellChoiceRow) {
    return [
      { value: FEAT_NO_SELECTION, label: FEAT_EDITOR_LABELS.choiceKeyNone },
      ...withSpellListChoiceOption(
        getSpellListChoiceOptions(model.value),
        row.spellFilter.classesFromChoiceKey,
      ),
    ];
  }

  /** Варианты времени накладывания вместе с пунктом «любое». */
  const castingTimeOptions = [
    { value: FEAT_NO_SELECTION, label: FEAT_EDITOR_LABELS.anyCastingTime },
    ...FEAT_CASTING_TIME_OPTIONS,
  ];

  /**
   * Смена типа сбрасывает набор: значения заданы справочником прежнего типа и в
   * новом означали бы не то.
   *
   * @param row строка выбора.
   * @param type новый тип выбора.
   */
  function setType(row: FeatSpellChoiceRow, type: FeatChoiceType) {
    row.type = type;
    row.options = [];
  }

  /** Допустимые характеристики выбора заклинательной характеристики. */
  function getAbilityOptions(row: FeatSpellChoiceRow): Array<AbilityKey> {
    return row.options
      .map((option) => option.value)
      .filter((value): value is AbilityKey => isAbilityKey(value));
  }

  /**
   * Записывает допустимые характеристики: «Посвящённый в магию» разрешает
   * Интеллект, Мудрость или Харизму, а не любую.
   *
   * @param row строка выбора.
   * @param keys выбранные характеристики.
   */
  function setAbilityOptions(
    row: FeatSpellChoiceRow,
    keys: AbilityKey | Array<AbilityKey> | undefined,
  ) {
    row.options = toUrlList(keys).map((value) => ({ value }));
  }

  /** Классы, из списков которых игрок выбирает при выборе списка класса. */
  function getClassOptionUrls(row: FeatSpellChoiceRow): Array<string> {
    return row.options.map((option) => option.value);
  }

  /**
   * Записывает классы-варианты выбора списка.
   *
   * @param row строка выбора.
   * @param urls url выбранных классов.
   */
  function setClassOptions(
    row: FeatSpellChoiceRow,
    urls: string | Array<string> | undefined,
  ) {
    // Снимок названия обязателен: лист персонажа показывает варианты выбора
    // подписями, а по одной ссылке он покажет игроку слаг «wizard-phb».
    // Известное название держится за ссылкой — справочник мог ещё не ответить
    const known = new Map(
      row.options.map((option) => [option.value, option.name]),
    );

    row.options = toUrlList(urls).map((value) => ({
      value,
      name: getClassEntry(value)?.name ?? known.get(value),
    }));
  }

  /** Заводит выбор заклинания: он встречается чаще списка и характеристики. */
  function addRow() {
    model.value = [
      ...model.value,
      createSpellChoiceRow('SPELL', getTakenChoiceKeys(rows)),
    ];
  }

  /**
   * Убирает выбор.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <InfoTooltip
      :text="FEAT_EDITOR_LABELS.spellChoicesHintDetails"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ FEAT_EDITOR_LABELS.spellChoicesHint }}</span>
    </InfoTooltip>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_EDITOR_LABELS.spellChoicesEmpty }}
    </p>

    <div
      v-for="(row, index) in model"
      :key="row.uid"
      class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/40 p-3"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="min-w-0 truncate text-sm font-medium text-highlighted">
          {{ getFeatSpellChoiceLabel(row.type) }}
        </span>

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="getFeatSpellChoiceLabel(row.type)"
          @click.left.exact.prevent="removeRow(index)"
        />
      </div>

      <div class="grid grid-cols-1 items-end gap-3 md:grid-cols-24">
        <UFormField
          class="md:col-span-10"
          :label="FEAT_EDITOR_LABELS.spellChoiceType"
        >
          <USelect
            :model-value="row.type"
            :items="FEAT_SPELL_CHOICE_TYPE_OPTIONS"
            value-key="value"
            @update:model-value="setType(row, $event)"
          />
        </UFormField>

        <UFormField
          class="md:col-span-4"
          :label="FEAT_EDITOR_LABELS.count"
        >
          <UInputNumber
            v-model="row.count"
            :min="1"
            :max="10"
            :disabled="row.countEqualsProficiencyBonus"
          />
        </UFormField>

        <div class="flex items-center md:col-span-10 md:self-end md:pb-2">
          <InfoTooltip
            :text="FEAT_EDITOR_LABELS.countEqualsProficiencyBonusHint"
            icon="tabler:info-circle-filled"
          >
            <UCheckbox
              v-model="row.countEqualsProficiencyBonus"
              :label="FEAT_EDITOR_LABELS.countEqualsProficiencyBonus"
            />
          </InfoTooltip>
        </div>

        <UFormField
          class="md:col-span-full"
          :label="FEAT_EDITOR_LABELS.label"
        >
          <UInput
            v-model="row.label"
            :placeholder="FEAT_EDITOR_LABELS.labelPlaceholder"
          />
        </UFormField>

        <UFormField
          v-if="row.type === 'SPELLCASTING_ABILITY'"
          class="md:col-span-full"
          :label="FEAT_EDITOR_LABELS.spellChoiceAbilities"
        >
          <SelectAbilities
            :model-value="getAbilityOptions(row)"
            multiple
            @update:model-value="setAbilityOptions(row, $event)"
          />
        </UFormField>

        <UFormField
          v-if="row.type === 'SPELL_LIST'"
          class="md:col-span-full"
          :label="FEAT_EDITOR_LABELS.spellChoiceClasses"
        >
          <SelectClass
            :model-value="getClassOptionUrls(row)"
            multiple
            @update:model-value="setClassOptions(row, $event)"
          />
        </UFormField>

        <div class="md:col-span-full">
          <UCheckbox
            v-model="row.rechooseOnLongRest"
            :label="FEAT_EDITOR_LABELS.rechooseOnLongRest"
          />
        </div>
      </div>

      <!-- Чем ограничен выбор заклинания -->
      <div
        v-if="isSpellPick(row)"
        class="flex flex-col gap-3 rounded-lg border border-muted/60 bg-elevated/20 p-3"
      >
        <InfoTooltip
          :text="FEAT_EDITOR_LABELS.spellFilterHint"
          icon="tabler:info-circle-filled"
          class="text-xs font-semibold tracking-wide text-dimmed"
        >
          <span>{{ FEAT_EDITOR_LABELS.spellFilterTitle }}</span>
        </InfoTooltip>

        <div class="grid grid-cols-1 items-end gap-3 md:grid-cols-24">
          <UFormField
            class="md:col-span-6"
            :label="FEAT_EDITOR_LABELS.spellLevel"
          >
            <SelectSpellLevel v-model="row.spellFilter.level" />
          </UFormField>

          <UFormField
            class="md:col-span-6"
            :label="FEAT_EDITOR_LABELS.spellMaxLevel"
          >
            <SelectSpellLevel v-model="row.spellFilter.maxLevel" />
          </UFormField>

          <UFormField
            class="md:col-span-12"
            :label="FEAT_EDITOR_LABELS.spellSchools"
          >
            <SelectMagicSchool
              v-model="row.spellFilter.schools"
              multiple
            />
          </UFormField>

          <UFormField
            class="md:col-span-12"
            :label="FEAT_EDITOR_LABELS.spellClasses"
          >
            <SelectClass
              :model-value="toEntityRefUrls(row.spellFilter.classes)"
              multiple
              @update:model-value="setFilterClasses(row, $event)"
            />
          </UFormField>

          <UFormField
            class="md:col-span-12"
            :label="FEAT_EDITOR_LABELS.castingTime"
          >
            <USelect
              :model-value="row.spellFilter.castingTime ?? FEAT_NO_SELECTION"
              :items="castingTimeOptions"
              value-key="value"
              @update:model-value="setCastingTime(row, $event)"
            />
          </UFormField>

          <UFormField class="md:col-span-full">
            <template #label>
              <InfoTooltip
                :text="FEAT_EDITOR_LABELS.spellClassesFromChoiceHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ FEAT_EDITOR_LABELS.spellClassesFromChoice }}</span>
              </InfoTooltip>
            </template>

            <USelect
              :model-value="
                row.spellFilter.classesFromChoiceKey || FEAT_NO_SELECTION
              "
              :items="getChoiceLinkOptions(row)"
              value-key="value"
              @update:model-value="setClassesFromChoice(row, $event)"
            />
          </UFormField>
        </div>
      </div>
    </div>

    <UButton
      icon="tabler:plus"
      :label="FEAT_EDITOR_LABELS.addSpellChoice"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="addRow"
    />
  </div>
</template>
