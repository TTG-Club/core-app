<script setup lang="ts">
  import type {
    FeatEditorLabelOverrides,
    FeatEditorRows,
    FeatSpellChoiceBlock,
    FeatSpellPickRow,
  } from '../../model';

  import { SelectClass } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { useFeatRefDirectory } from '../../composable';
  import {
    CHOICE_COUNT_MIN,
    CLASS_LEVEL_MAX,
    CLASS_LEVEL_MIN,
    createSpellPickRow,
    FEAT_SPELL_LEVEL_OPTIONS,
    FEAT_SPELL_PICK_SOURCE_OPTIONS,
    getFeatEditorLabels,
    getFeatSpellLevelValue,
    getTakenChoiceKeys,
    parseFeatSpellLevelValue,
    SPELL_PICK_COUNT_MAX,
    toEntityRefUrls,
    toUrlList,
  } from '../../model';
  import FeatEntityRefRows from './FeatEntityRefRows.vue';
  import FeatRowsSection from './FeatRowsSection.vue';

  /**
   * Заклинания, которые игрок выбирает сам при взятии записи.
   *
   * Пул строки собирается двумя способами. Поиском по справочнику — по кругу и
   * спискам классов блока: список классов один на все такие строки,
   * «Посвящённый в магию» спрашивает класс один раз и берёт из него и
   * заговоры, и заклинание первого круга. Либо перечислением конкретных
   * заклинаний — тогда круг и класс у каждой записи свои, и строка их не
   * спрашивает. Служебный выбор класса и ссылку на него форма пишет сама —
   * автору о них знать незачем.
   *
   * У строки есть уровень: «Таинственный арканум» колдуна спрашивает заклинание
   * 6 круга на 11 уровне, 7 круга — на 13, и без уровня лист задал бы все
   * четыре вопроса разом.
   *
   * Блок общий для черты, класса, его умения, варианта умения, вида и
   * предыстории: подписи, в которых черта названа источником, форма-владелец
   * переопределяет.
   */
  const {
    rows,
    labels = {},
    title = undefined,
  } = defineProps<{
    /** Все строки редактора: из них берутся занятые ключи выборов. */
    rows: FeatEditorRows;

    /**
     * Подписи формы-владельца: чертой источник даров называет только форма
     * черты, у умения класса свои формулировки.
     */
    labels?: FeatEditorLabelOverrides;

    /**
     * Заголовок блока: с ним строки рисуются в рамке с кнопкой добавления в
     * шапке. Пусто — форма-владелец рисует заголовок сама.
     */
    title?: string;
  }>();

  const model = defineModel<FeatSpellChoiceBlock>({ required: true });

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /** Url выбранных классов: по ним справочник отдаёт снимки названий. */
  const classUrls = computed<Array<string>>(() =>
    toEntityRefUrls(model.value.classes),
  );

  /**
   * Списки классов спрашиваются, только пока есть порция с поиском по кругу:
   * они и есть её фильтр, а хранятся внутри самой порции. У записи, где все
   * порции перечисляют заклинания, классам негде лежать — поле сохранило бы
   * выбранное только до перезагрузки формы.
   */
  const isClassesShown = computed(() =>
    model.value.picks.some((pick) => pick.source === 'FILTER'),
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
   * Строка берёт пул из перечисленных заклинаний, а не поиском по кругу.
   *
   * @param row строка выбора.
   * @returns `true` — пул перечислен.
   */
  function isListSource(row: FeatSpellPickRow): boolean {
    return row.source === 'LIST';
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
  <FeatRowsSection
    :title="title"
    :summary="texts.spellChoicesHint"
    :hint="texts.spellChoicesHintDetails"
    :count="model.picks.length"
    :add-label="texts.addSpellChoice"
    @add="addRow"
  >
    <UFormField v-if="isClassesShown">
      <template #label>
        <InfoTooltip
          :text="texts.spellChoiceClassesHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ texts.spellChoiceClasses }}</span>
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
      {{ texts.spellChoicesEmpty }}
    </p>

    <div
      v-for="(row, index) in model.picks"
      :key="row.uid"
      class="grid grid-cols-1 items-end gap-3 rounded-lg border border-default bg-elevated/40 p-3 md:grid-cols-24"
    >
      <UFormField class="md:col-span-7">
        <template #label>
          <InfoTooltip
            :text="texts.spellChoiceSourceHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ texts.spellChoiceSource }}</span>
          </InfoTooltip>
        </template>

        <USelect
          v-model="row.source"
          :items="FEAT_SPELL_PICK_SOURCE_OPTIONS"
          value-key="value"
        />
      </UFormField>

      <!-- У перечисленных заклинаний круг свой у каждой записи: селект круга
        заменяет подпись, чтобы сетка строки не прыгала при смене источника -->
      <UFormField
        class="md:col-span-5"
        :label="texts.spellChoiceLevel"
      >
        <USelect
          v-if="!isListSource(row)"
          :model-value="getLevelValue(row)"
          :items="FEAT_SPELL_LEVEL_OPTIONS"
          value-key="value"
          @update:model-value="setLevelValue(row, $event)"
        />

        <p
          v-else
          class="py-1.5 text-sm text-dimmed italic"
        >
          {{ texts.spellChoiceLevelFromRecord }}
        </p>
      </UFormField>

      <UFormField
        class="md:col-span-3"
        :label="texts.spellChoiceCount"
      >
        <UInputNumber
          v-model="row.count"
          :min="CHOICE_COUNT_MIN"
          :max="SPELL_PICK_COUNT_MAX"
          :disabled="row.countEqualsProficiencyBonus"
        />
      </UFormField>

      <!-- Уровень — своим полем у строки: «Таинственный арканум» спрашивает
        6 круг на 11 уровне, 7 круг — на 13; без уровня все порции спросили бы
        разом на уровне умения -->
      <UFormField class="md:col-span-3">
        <template #label>
          <InfoTooltip
            :text="texts.choiceRequiredLevelHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ texts.choiceRequiredLevel }}</span>
          </InfoTooltip>
        </template>

        <UInputNumber
          v-model="row.requiredLevel"
          :min="CLASS_LEVEL_MIN"
          :max="CLASS_LEVEL_MAX"
          :aria-label="texts.choiceRequiredLevel"
        />
      </UFormField>

      <div class="flex items-center md:col-span-5 md:self-end md:pb-2">
        <InfoTooltip
          :text="texts.countEqualsProficiencyBonusHint"
          icon="tabler:info-circle-filled"
        >
          <UCheckbox
            v-model="row.countEqualsProficiencyBonus"
            :label="texts.countEqualsProficiencyBonus"
          />
        </InfoTooltip>
      </div>

      <div class="flex justify-end md:col-span-1 md:self-end md:pb-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="texts.removeSpellChoice"
          @click.left.exact.prevent="removeRow(index)"
        />
      </div>

      <!-- Перечисленный пул: записи только выбираются из справочника, круг
        показан бейджем строки -->
      <UFormField
        v-if="isListSource(row)"
        class="md:col-span-full"
        :label="texts.spellChoiceListSpells"
      >
        <FeatEntityRefRows
          v-model="row.spells"
          kind="SPELL"
        />
      </UFormField>

      <UFormField
        class="md:col-span-full"
        :label="texts.spellChoiceLabel"
      >
        <UInput
          v-model="row.label"
          :placeholder="texts.spellChoiceLabelPlaceholder"
        />
      </UFormField>
    </div>
  </FeatRowsSection>
</template>
