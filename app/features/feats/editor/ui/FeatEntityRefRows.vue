<script setup lang="ts">
  import type { FeatRefKind } from '../../composable';
  import type { FeatEntityRef } from '../../model';

  import {
    SelectBackground,
    SelectClassCatalog,
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
  const { kind, featCategories = [] } = defineProps<{
    /** Раздел справочника, из которого выбираются записи. */
    kind: FeatRefKind;

    /**
     * Категории черт, из которых выбирают (`['ORIGIN']`); пусто — предлагаются
     * все. Предыстория даёт только черту происхождения, и общая черта в её
     * списке была бы ошибкой правил, а не выбором автора.
     */
    featCategories?: Array<string>;
  }>();

  const model = defineModel<Array<FeatEntityRef>>({ required: true });

  const urls = computed<Array<string>>(() =>
    model.value.map((reference) => reference.url),
  );

  const { getEntry } = useFeatRefDirectory(() => kind, urls);

  /**
   * Значение поля добавления: после выбора оно сбрасывается. Выбор
   * множественный — список закрывается не после каждой записи, и отметить
   * подряд несколько заклинаний можно за один заход.
   */
  const pickedUrls = ref<Array<string>>([]);

  /**
   * Дописывает выбранные записи. Уже перечисленные пропускаются: повтор ничего
   * не добавляет ни требованию, ни выдаче.
   *
   * @param picked ссылки выбранных записей.
   */
  function addRef(picked: string | Array<string> | undefined) {
    const pickedList = Array.isArray(picked) ? picked : [picked];

    const added = pickedList.flatMap((url) =>
      url && !urls.value.includes(url) ? [url] : [],
    );

    if (added.length) {
      // Снимок названия пишется сразу: из него карточка черты собирает условие
      // («черта «Отмеченный драконом»»), а core-api имя ссылки не подставляет.
      // У записей, выбранных до этого, имени нет — там останется ссылка, пока
      // черту не пересохранят
      model.value = [
        ...model.value,
        ...added.map((url) => ({ url, name: getEntry(url)?.name })),
      ];
    }

    pickedUrls.value = [];
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
      :model-value="pickedUrls"
      :exclude-urls="urls"
      :categories="featCategories"
      multiple
      @update:model-value="addRef"
    />

    <SelectClassCatalog
      v-else-if="kind === 'CLASS'"
      :model-value="pickedUrls"
      :exclude-urls="urls"
      multiple
      @update:model-value="addRef"
    />

    <SelectSpecies
      v-else-if="kind === 'SPECIES'"
      :model-value="pickedUrls"
      multiple
      @update:model-value="addRef"
    />

    <SelectBackground
      v-else-if="kind === 'BACKGROUND'"
      :model-value="pickedUrls"
      multiple
      @update:model-value="addRef"
    />

    <SelectSpell
      v-else-if="kind === 'SPELL'"
      :model-value="pickedUrls"
      :exclude-urls="urls"
      multiple
      @update:model-value="addRef"
    />
  </div>
</template>
