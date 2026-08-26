<script setup lang="ts">
  import type { FeatEntityRef } from '~feats/model';

  import type { BackgroundToolChoice } from '../../model';

  import { SelectItem } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { BACKGROUND_PARAMS_TAB_LABELS } from '../../model';

  /**
   * Владение инструментами предыстории: фиксированные карточки и выбор игрока.
   *
   * Инструменты только ВЫБИРАЮТСЯ карточками раздела «Предметы» — по адресу
   * страницы лист персонажа находит инструмент в каталоге, а выгрузка переводит
   * его в ключ справочника стола. Набранное руками название не сходится ни с
   * тем, ни с другим от одной опечатки, поэтому свободный текст остаётся
   * отдельным легаси-полем формы.
   */
  const fixed = defineModel<Array<FeatEntityRef>>('fixed', { required: true });

  const choice = defineModel<BackgroundToolChoice>('choice', {
    required: true,
  });

  /** Адреса фиксированных инструментов — значение селекта. */
  const fixedUrls = computed<Array<string>>(() =>
    fixed.value.map((reference) => reference.url),
  );

  /** Адреса инструментов пула выбора. */
  const choiceUrls = computed<Array<string>>(() =>
    choice.value.from.map((reference) => reference.url),
  );

  /**
   * Записывает фиксированные инструменты. Снимок названия пишется сразу:
   * core-api имя ссылки не подставляет, а лист персонажа без него покажет
   * владение адресом страницы.
   *
   * @param refs выбранные карточки инструментов.
   */
  function setFixed(refs: Array<FeatEntityRef>) {
    fixed.value = refs.map((reference) => ({
      url: reference.url,
      name: reference.name,
    }));
  }

  /**
   * Записывает пул выбора.
   *
   * @param refs выбранные карточки инструментов.
   */
  function setChoiceFrom(refs: Array<FeatEntityRef>) {
    choice.value = {
      ...choice.value,
      from: refs.map((reference) => ({
        url: reference.url,
        name: reference.name,
      })),
    };
  }

  /**
   * Записывает количество инструментов выбора.
   *
   * @param count сколько инструментов выбирает игрок.
   */
  function setChoiceCount(count: number | undefined) {
    choice.value = { ...choice.value, count };
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
    <UFormField class="col-span-full">
      <template #label>
        <InfoTooltip
          :text="BACKGROUND_PARAMS_TAB_LABELS.toolsHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ BACKGROUND_PARAMS_TAB_LABELS.tools }}</span>
        </InfoTooltip>
      </template>

      <SelectItem
        :model-value="fixedUrls"
        multiple
        @select="setFixed"
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      :label="BACKGROUND_PARAMS_TAB_LABELS.toolChoiceCount"
    >
      <UInputNumber
        :model-value="choice.count"
        :min="1"
        :max="5"
        @update:model-value="setChoiceCount"
      />
    </UFormField>

    <UFormField
      class="md:col-span-18"
      :label="BACKGROUND_PARAMS_TAB_LABELS.toolChoiceFrom"
      :help="BACKGROUND_PARAMS_TAB_LABELS.toolChoiceFromHint"
    >
      <SelectItem
        :model-value="choiceUrls"
        multiple
        @select="setChoiceFrom"
      />
    </UFormField>
  </div>
</template>
