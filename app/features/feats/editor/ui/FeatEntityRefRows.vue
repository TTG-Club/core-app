<script setup lang="ts">
  import type { FeatRefKind } from '../../composable';
  import type { FeatEntityRef } from '../../model';

  import {
    SelectBackground,
    SelectClass,
    SelectFeat,
    SelectSpecies,
    SelectSpell,
  } from '~ui/select';

  import { useFeatRefDirectory } from '../../composable';
  import { FEAT_REF_ROWS_LABELS, getFeatSpellCircleLabel } from '../../model';

  /**
   * Список ссылок на записи справочника: требуемые черта, класс, вид и
   * предыстория, выдаваемое заклинание.
   *
   * Записи только ВЫБИРАЮТСЯ — вписать название руками нельзя: сверка идёт по
   * url записи, и набранное руками расходится со справочником от одной
   * опечатки. Строка показывает название ссылкой на карточку, источник бейджем
   * и предупреждение, если записи с таким url в справочнике не нашлось.
   *
   * Своё поле у строки — через слот `row`: у выдаваемых чертой заклинаний это
   * уровень, с которого заклинание доступно.
   */
  const { kind } = defineProps<{
    /** Раздел справочника, из которого выбираются записи. */
    kind: FeatRefKind;
  }>();

  const model = defineModel<Array<FeatEntityRef>>({ required: true });

  const urls = computed<Array<string>>(() =>
    model.value.map((reference) => reference.url),
  );

  const { getEntry } = useFeatRefDirectory(() => kind, urls);

  /** Значение селекта-добавления: после выбора оно сбрасывается. */
  const pickedUrl = ref<string>('');

  /**
   * Дописывает выбранную запись. Уже перечисленная пропускается: повтор ничего
   * не добавляет ни требованию, ни выдаче.
   *
   * @param url ссылка выбранной записи.
   */
  function addRef(url: string | Array<string> | undefined) {
    const picked = Array.isArray(url) ? url[0] : url;

    if (picked && !urls.value.includes(picked)) {
      // Снимок названия пишется сразу: из него карточка черты собирает условие
      // («черта «Отмеченный драконом»»), а core-api имя ссылки не подставляет.
      // У записей, выбранных до этого, имени нет — там останется ссылка, пока
      // черту не пересохранят
      model.value = [
        ...model.value,
        { url: picked, name: getEntry(picked)?.name },
      ];
    }

    pickedUrl.value = '';
  }

  /**
   * Убирает запись из списка.
   *
   * @param index номер строки в списке.
   */
  function removeRef(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  /**
   * Подпись строки: название записи, а пока справочник не ответил — сама
   * ссылка. Пустой строки в списке быть не должно, иначе удалить её не за что.
   *
   * @param reference ссылка строки.
   * @returns подпись строки.
   */
  function getLabel(reference: FeatEntityRef): string {
    return getEntry(reference.url)?.name ?? reference.name ?? reference.url;
  }

  /**
   * Подпись круга заклинания; пусто — у записи круга нет либо справочник ещё
   * не ответил.
   *
   * @param reference ссылка строки.
   * @returns подпись круга.
   */
  function getCircleLabel(reference: FeatEntityRef): string {
    const level = getEntry(reference.url)?.level;

    return level === undefined ? '' : getFeatSpellCircleLabel(level);
  }
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <p
      v-if="!model.length"
      class="text-xs text-dimmed italic"
    >
      {{ FEAT_REF_ROWS_LABELS.empty }}
    </p>

    <div
      v-for="(reference, index) in model"
      :key="reference.url"
      class="flex items-center gap-2 rounded-lg bg-elevated/40 py-1 pr-1 pl-2"
    >
      <ULink
        v-if="getEntry(reference.url)"
        :to="getEntry(reference.url)?.route"
        target="_blank"
        class="min-w-0 flex-1 truncate text-sm text-primary"
        :title="FEAT_REF_ROWS_LABELS.openEntry"
      >
        {{ getLabel(reference) }}
      </ULink>

      <span
        v-else
        class="min-w-0 flex-1 truncate text-sm"
      >
        {{ getLabel(reference) }}
      </span>

      <!-- Круг заклинания: в механику он не пишется, показан для справки —
        по нему страница черты разбивает таблицу «Заклинания метки» -->
      <UBadge
        v-if="getCircleLabel(reference)"
        color="neutral"
        variant="subtle"
        size="sm"
        class="shrink-0"
      >
        {{ getCircleLabel(reference) }}
      </UBadge>

      <UBadge
        v-if="getEntry(reference.url)"
        color="success"
        variant="subtle"
        size="sm"
        icon="tabler:book"
        class="shrink-0"
      >
        {{ getEntry(reference.url)?.source }}
      </UBadge>

      <UBadge
        v-else
        color="warning"
        variant="subtle"
        size="sm"
        icon="tabler:alert-triangle"
        class="shrink-0"
        :title="FEAT_REF_ROWS_LABELS.missingHint"
      >
        {{ FEAT_REF_ROWS_LABELS.missing }}
      </UBadge>

      <slot
        name="row"
        :entry="reference"
        :index="index"
      />

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        :aria-label="getLabel(reference)"
        @click.left.exact.prevent="removeRef(index)"
      />
    </div>

    <SelectFeat
      v-if="kind === 'FEAT'"
      :model-value="pickedUrl"
      :exclude-urls="urls"
      @update:model-value="addRef"
    />

    <SelectClass
      v-else-if="kind === 'CLASS'"
      :model-value="pickedUrl"
      :excluded-values="urls"
      @update:model-value="addRef"
    />

    <SelectSpecies
      v-else-if="kind === 'SPECIES'"
      :model-value="pickedUrl"
      @update:model-value="addRef"
    />

    <SelectBackground
      v-else-if="kind === 'BACKGROUND'"
      :model-value="pickedUrl"
      @update:model-value="addRef"
    />

    <SelectSpell
      v-else-if="kind === 'SPELL'"
      :model-value="pickedUrl"
      :exclude-urls="urls"
      @update:model-value="addRef"
    />
  </div>
</template>
