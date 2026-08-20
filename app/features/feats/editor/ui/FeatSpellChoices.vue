<script setup lang="ts">
  import type {
    FeatEditorRows,
    FeatSpellChoiceBlock,
    FeatSpellPickRow,
  } from '../../model';

  import { SelectClass } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { useFeatRefDirectory } from '../../composable';
  import {
    createSpellPickRow,
    FEAT_EDITOR_LABELS,
    FEAT_SPELL_LEVEL_OPTIONS,
    getFeatSpellLevelValue,
    getTakenChoiceKeys,
    parseFeatSpellLevelValue,
    toEntityRefUrls,
    toUrlList,
  } from '../../model';

  /**
   * Заклинания, которые игрок выбирает сам при взятии черты.
   *
   * Список классов один на все строки: «Посвящённый в магию» спрашивает класс
   * один раз и берёт из него и заговоры, и заклинание первого круга. Служебный
   * выбор класса и ссылку на него форма пишет сама — автору о них знать незачем.
   */
  const { rows } = defineProps<{
    /** Все строки редактора: из них берутся занятые ключи выборов. */
    rows: FeatEditorRows;
  }>();

  const model = defineModel<FeatSpellChoiceBlock>({ required: true });

  /** Url выбранных классов: по ним справочник отдаёт снимки названий. */
  const classUrls = computed<Array<string>>(() =>
    toEntityRefUrls(model.value.classes),
  );

  const { getEntry: getClassEntry } = useFeatRefDirectory('CLASS', classUrls);

  /**
   * Записывает классы, из списков которых игрок выбирает.
   *
   * Снимок названия обязателен: лист персонажа показывает варианты выбора
   * подписями, а по одной ссылке он покажет игроку слаг «wizard-phb».
   * Известное название держится за ссылкой — справочник мог ещё не ответить.
   *
   * @param urls url выбранных классов.
   */
  function setClasses(urls: string | Array<string> | undefined) {
    const known = new Map(
      model.value.classes.map((reference) => [reference.url, reference.name]),
    );

    model.value = {
      ...model.value,
      classes: toUrlList(urls).map((url) => ({
        url,
        name: getClassEntry(url)?.name ?? known.get(url),
      })),
    };
  }

  /**
   * Значение селекта круга: в записи круг задан двумя полями фильтра, а автору
   * показывается одним списком.
   *
   * @param row строка выбора.
   * @returns значение селекта.
   */
  function getLevelValue(row: FeatSpellPickRow): string {
    return getFeatSpellLevelValue(row.mode, row.level);
  }

  /**
   * Записывает круг строки.
   *
   * @param row строка выбора.
   * @param value значение селекта.
   */
  function setLevelValue(row: FeatSpellPickRow, value: string) {
    const parsed = parseFeatSpellLevelValue(value);

    row.mode = parsed.mode;
    row.level = parsed.level;
  }

  /** Заводит строку выбора заклинаний. */
  function addRow() {
    model.value = {
      ...model.value,
      picks: [
        ...model.value.picks,
        createSpellPickRow(getTakenChoiceKeys(rows)),
      ],
    };
  }

  /**
   * Убирает строку выбора.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = {
      ...model.value,
      picks: model.value.picks.filter((_, position) => position !== index),
    };
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

    <UFormField>
      <template #label>
        <InfoTooltip
          :text="FEAT_EDITOR_LABELS.spellChoiceClassesHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ FEAT_EDITOR_LABELS.spellChoiceClasses }}</span>
        </InfoTooltip>
      </template>

      <SelectClass
        :model-value="classUrls"
        multiple
        @update:model-value="setClasses"
      />
    </UFormField>

    <p
      v-if="!model.picks.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_EDITOR_LABELS.spellChoicesEmpty }}
    </p>

    <div
      v-for="(row, index) in model.picks"
      :key="row.uid"
      class="grid grid-cols-1 items-end gap-3 rounded-lg border border-default bg-elevated/40 p-3 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-8"
        :label="FEAT_EDITOR_LABELS.spellChoiceLevel"
      >
        <USelect
          :model-value="getLevelValue(row)"
          :items="FEAT_SPELL_LEVEL_OPTIONS"
          value-key="value"
          @update:model-value="setLevelValue(row, $event)"
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="FEAT_EDITOR_LABELS.spellChoiceCount"
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

      <div class="flex justify-end md:col-span-1 md:self-end md:pb-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="FEAT_EDITOR_LABELS.removeSpellChoice"
          @click.left.exact.prevent="removeRow(index)"
        />
      </div>

      <UFormField
        class="md:col-span-full"
        :label="FEAT_EDITOR_LABELS.spellChoiceLabel"
      >
        <UInput
          v-model="row.label"
          :placeholder="FEAT_EDITOR_LABELS.spellChoiceLabelPlaceholder"
        />
      </UFormField>
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
