<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type {
    FeatChoice,
    FeatChoiceDomain,
    FeatChoiceType,
    FeatSpellFilter,
  } from '../../model';

  import { InputWithLibrary } from '~ui/input';
  import { SelectClass, SelectMagicSchool, SelectSpellLevel } from '~ui/select';

  import {
    createFeatChoice,
    createSpellFilter,
    FEAT_CASTING_TIME_OPTIONS,
    FEAT_CHOICE_DEFAULT_TYPE_BY_DOMAIN,
    FEAT_CHOICE_FIELD_LABELS,
    FEAT_CHOICE_GRANT_OPTIONS,
    FEAT_CHOICE_KEY_BY_TYPE,
    FEAT_CHOICE_KEY_SUGGESTIONS,
    FEAT_MECHANICS_EDITOR,
    getFeatChoiceDomain,
    getFeatChoiceLinkOptions,
    getFeatChoiceTypeOptions,
    getFreeFeatChoiceKey,
    isExpertiseChoiceType,
    isProficiencyChoiceType,
    isSpellChoiceType,
    toEntityRefs,
    toEntityRefUrls,
    toUrlList,
    withFeatChoiceLink,
    withFeatChoiceType,
  } from '../../model';

  const { domain } = defineProps<{
    /** Раздел механики, чьи выборы правит этот список. */
    domain: FeatChoiceDomain;
  }>();

  const model = defineModel<Array<FeatChoice>>({ default: () => [] });

  /**
   * Выборы раздела вместе с их местом в общем списке: механика хранит выборы
   * одним массивом, а форма раскладывает их по разделам, поэтому правка
   * обращается к исходному номеру, а не к номеру строки на экране.
   */
  const entries = computed<Array<{ choice: FeatChoice; index: number }>>(() =>
    model.value
      .map((choice, index) => ({ choice, index }))
      .filter(({ choice }) => getFeatChoiceDomain(choice.type) === domain),
  );

  /** Типы, которые предлагает селект «Что выбирают» в этом разделе. */
  const typeOptions = computed(() => getFeatChoiceTypeOptions(domain));

  /**
   * Ключ виден только там, где на выбор ссылаются руками: в модификаторах листа
   * сопротивление указывает ключ выбора типа урона строкой. В остальных
   * разделах ссылку даёт селект по имени выбора, а ключ проставляется сам —
   * менять его незачем, а у взятой черты правка ключа потеряла бы ответ игрока.
   */
  const withKey = computed<boolean>(() => domain === 'OTHER');

  /**
   * Выборы списка заклинаний: из ответа на такой выбор пул сужается до одного
   * класса — «Посвящённый в магию» спрашивает список жреца, друида или
   * волшебника, а заговоры даёт выбрать уже из него.
   */
  const spellListOptions = computed<Array<SelectOption>>(() =>
    getFeatChoiceLinkOptions(model.value, ['SPELL_LIST']),
  );

  /**
   * Классы пула строкой url: селект справочника хранит только их, а фильтр —
   * ссылки.
   *
   * @param filter фильтр заклинаний выбора.
   * @returns url классов.
   */
  function getFilterClassUrls(filter: FeatSpellFilter): Array<string> {
    return toEntityRefUrls(filter.classes);
  }

  /**
   * Записывает классы пула ссылками.
   *
   * @param index номер выбора в списке.
   * @param urls url выбранных классов.
   */
  function setFilterClasses(
    index: number,
    urls: string | Array<string> | undefined,
  ) {
    const filter = model.value[index]?.spellFilter;

    if (!filter) {
      return;
    }

    patchChoice(index, {
      spellFilter: { ...filter, classes: toEntityRefs(toUrlList(urls)) },
    });
  }

  /** Ключи, занятые остальными выборами черты. */
  function getTakenKeys(exceptIndex: number): Array<string> {
    return model.value
      .filter((_, position) => position !== exceptIndex)
      .map((choice) => choice.key.trim())
      .filter((key) => !!key);
  }

  /** Ключи, встречающиеся у нескольких выборов сразу. */
  const duplicateKeys = computed(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const choice of model.value) {
      const key = choice.key.trim();

      if (!key) {
        continue;
      }

      if (seen.has(key)) {
        duplicates.add(key);
      }

      seen.add(key);
    }

    return duplicates;
  });

  /**
   * Ошибка поля ключа: два выбора с одним ключом схлопнулись бы в один, и ответ
   * игрока на второй потерялся бы.
   *
   * @param choice выбор черты.
   * @returns текст ошибки; undefined — ключ свободен.
   */
  function getKeyError(choice: FeatChoice): string | undefined {
    return duplicateKeys.value.has(choice.key.trim())
      ? FEAT_CHOICE_FIELD_LABELS.duplicateKeyError
      : undefined;
  }

  /**
   * Варианты ссылки на выбор списка заклинаний вместе с уже записанным: выбор,
   * на который ссылались, могли удалить, и потерять ссылку молча нельзя.
   *
   * @param filter фильтр заклинаний выбора.
   * @returns варианты списка.
   */
  function getSpellListOptions(filter: FeatSpellFilter): Array<SelectOption> {
    return withFeatChoiceLink(
      spellListOptions.value,
      filter.classesFromChoiceKey,
    );
  }

  /**
   * Новый выбор сразу получает тип своего раздела: без типа он не попал бы ни в
   * один раздел и исчез бы с экрана.
   */
  function addChoice() {
    const type = FEAT_CHOICE_DEFAULT_TYPE_BY_DOMAIN[domain];

    model.value = [
      ...model.value,
      {
        ...createFeatChoice(),
        type,
        key: getFreeFeatChoiceKey(
          FEAT_CHOICE_KEY_BY_TYPE[type],
          getTakenKeys(model.value.length),
        ),
      },
    ];
  }

  function removeChoice(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function patchChoice(index: number, patch: Partial<FeatChoice>) {
    model.value = model.value.map((choice, position) =>
      position === index ? { ...choice, ...patch } : choice,
    );
  }

  /**
   * Смена типа выбора заодно подсказывает ключ, но только пустому полю:
   * введённое руками имя не перетирается, а занятое в этой черте получает
   * номер.
   *
   * @param index номер выбора в списке.
   * @param type новый тип выбора.
   */
  function changeType(index: number, type: FeatChoiceType | undefined) {
    const choice = model.value[index];

    if (!choice) {
      return;
    }

    if (!type || choice.key.trim()) {
      patchChoice(index, { type });

      return;
    }

    patchChoice(index, {
      type,
      key: getFreeFeatChoiceKey(
        FEAT_CHOICE_KEY_BY_TYPE[type],
        getTakenKeys(index),
      ),
    });
  }

  function toggleSpellFilter(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    patchChoice(index, {
      spellFilter: enabled === true ? createSpellFilter() : undefined,
    });
  }

  /**
   * Ограничения пула взаимно исключают друг друга: вместе они не оставляют, из
   * чего выбирать, поэтому включение одного снимает второе.
   *
   * @param index номер выбора в списке.
   * @param enabled новое значение отметки.
   */
  function toggleOnlyIfProficient(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    const isEnabled = enabled === true;

    patchChoice(
      index,
      isEnabled
        ? { onlyIfProficient: true, onlyIfNotProficient: false }
        : { onlyIfProficient: false },
    );
  }

  /**
   * Обратная отметка пула — с тем же взаимным исключением.
   *
   * @param index номер выбора в списке.
   * @param enabled новое значение отметки.
   */
  function toggleOnlyIfNotProficient(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    const isEnabled = enabled === true;

    patchChoice(
      index,
      isEnabled
        ? { onlyIfNotProficient: true, onlyIfProficient: false }
        : { onlyIfNotProficient: false },
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-dimmed">
        {{ FEAT_MECHANICS_EDITOR.choiceHintByDomain[domain] }}
      </span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addChoice"
      >
        {{ FEAT_MECHANICS_EDITOR.addChoiceLabel }}
      </UButton>
    </div>

    <p
      v-if="!entries.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_MECHANICS_EDITOR.emptyChoicesHint }}
    </p>

    <div
      v-for="{ choice, index } in entries"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        v-if="withKey"
        class="col-span-full md:col-span-6"
        :label="FEAT_CHOICE_FIELD_LABELS.key"
        :error="getKeyError(choice)"
      >
        <InputWithLibrary
          v-model="choice.key"
          :options="FEAT_CHOICE_KEY_SUGGESTIONS"
          :placeholder="FEAT_CHOICE_FIELD_LABELS.keyPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="FEAT_CHOICE_FIELD_LABELS.type"
      >
        <USelectMenu
          :items="withFeatChoiceType(typeOptions, choice.type)"
          :model-value="choice.type"
          value-key="value"
          @update:model-value="changeType(index, $event)"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-9"
        :label="FEAT_CHOICE_FIELD_LABELS.label"
      >
        <UInput
          v-model="choice.label"
          :placeholder="FEAT_CHOICE_FIELD_LABELS.labelPlaceholder"
        />
      </UFormField>

      <div class="col-span-full flex justify-end md:col-span-1">
        <UButton
          color="error"
          icon="tabler:trash"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="removeChoice(index)"
        />
      </div>

      <UFormField
        class="col-span-12 md:col-span-4"
        :label="FEAT_CHOICE_FIELD_LABELS.count"
      >
        <UInputNumber
          v-model="choice.count"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-12 md:col-span-6"
        :label="FEAT_CHOICE_FIELD_LABELS.countEqualsProficiencyBonus"
      >
        <UCheckbox v-model="choice.countEqualsProficiencyBonus" />
      </UFormField>

      <!-- Ограничить пул уже имеющимся владением можно только там, где владение
        бывает: у заклинания или типа урона его нет, и отметки лишь путали бы -->
      <template v-if="isProficiencyChoiceType(choice.type)">
        <UFormField
          class="col-span-12 md:col-span-4"
          :label="FEAT_CHOICE_FIELD_LABELS.onlyIfNotProficient"
        >
          <UCheckbox
            :model-value="choice.onlyIfNotProficient"
            @update:model-value="toggleOnlyIfNotProficient(index, $event)"
          />
        </UFormField>

        <UFormField
          class="col-span-12 md:col-span-4"
          :label="FEAT_CHOICE_FIELD_LABELS.onlyIfProficient"
        >
          <UCheckbox
            :model-value="choice.onlyIfProficient"
            @update:model-value="toggleOnlyIfProficient(index, $event)"
          />
        </UFormField>
      </template>

      <!-- Компетентность удваивает бонус мастерства в проверке, поэтому бывает
        только у навыков и инструментов -->
      <template v-if="isExpertiseChoiceType(choice.type)">
        <UFormField
          class="col-span-12 md:col-span-6"
          :label="FEAT_CHOICE_FIELD_LABELS.grants"
        >
          <USelectMenu
            v-model="choice.grants"
            :items="FEAT_CHOICE_GRANT_OPTIONS"
            value-key="value"
          />
        </UFormField>

        <UFormField
          class="col-span-12 md:col-span-5"
          :label="FEAT_CHOICE_FIELD_LABELS.expertiseIfProficient"
        >
          <UCheckbox v-model="choice.expertiseIfProficient" />
        </UFormField>
      </template>

      <UFormField
        class="col-span-12 md:col-span-5"
        :label="FEAT_CHOICE_FIELD_LABELS.rechooseOnLongRest"
      >
        <UCheckbox v-model="choice.rechooseOnLongRest" />
      </UFormField>

      <template v-if="isSpellChoiceType(choice.type)">
        <UFormField
          class="col-span-full md:col-span-6"
          :label="FEAT_CHOICE_FIELD_LABELS.spellFilter"
        >
          <UCheckbox
            :model-value="!!choice.spellFilter"
            @update:model-value="toggleSpellFilter(index, $event)"
          />
        </UFormField>

        <template v-if="choice.spellFilter">
          <UFormField
            class="col-span-12 md:col-span-5"
            :label="FEAT_CHOICE_FIELD_LABELS.spellLevel"
          >
            <SelectSpellLevel v-model="choice.spellFilter.level" />
          </UFormField>

          <UFormField
            class="col-span-12 md:col-span-5"
            :label="FEAT_CHOICE_FIELD_LABELS.spellMaxLevel"
          >
            <SelectSpellLevel v-model="choice.spellFilter.maxLevel" />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-4"
            :label="FEAT_CHOICE_FIELD_LABELS.spellSchools"
          >
            <SelectMagicSchool
              v-model="choice.spellFilter.schools"
              multiple
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-4"
            :label="FEAT_CHOICE_FIELD_LABELS.castingTime"
          >
            <USelectMenu
              v-model="choice.spellFilter.castingTime"
              :items="FEAT_CASTING_TIME_OPTIONS"
              value-key="value"
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-8"
            :label="FEAT_CHOICE_FIELD_LABELS.spellClasses"
          >
            <SelectClass
              :model-value="getFilterClassUrls(choice.spellFilter)"
              multiple
              @update:model-value="setFilterClasses(index, $event)"
            />
          </UFormField>

          <!-- «Посвящённый в магию»: класс не задан заранее, его выбирает игрок,
            и пул сужается до одного выбранного списка -->
          <UFormField
            class="col-span-full md:col-span-8"
            :label="FEAT_CHOICE_FIELD_LABELS.spellClassesFromChoice"
          >
            <USelectMenu
              v-model="choice.spellFilter.classesFromChoiceKey"
              :items="getSpellListOptions(choice.spellFilter)"
              value-key="value"
            />
          </UFormField>
        </template>
      </template>
    </div>
  </div>
</template>
