<script setup lang="ts">
  import { computed, h, ref } from 'vue';
  import type { Cell, ColumnDef, Header } from '@tanstack/vue-table';
  import {
    FlexRender,
    getCoreRowModel,
    useVueTable,
  } from '@tanstack/vue-table';
  import { useDebounceFn } from '@vueuse/core';
  import type {
    ClassFeature,
    ClassInMulticlass,
    ClassTable,
    CasterType,
  } from '~classes/types';
  import { maxBy, omit, orderBy } from 'lodash-es';
  import { useDndMechanics } from './useDndMechanics';
  import { LEVELS } from '~/shared/consts';
  import type { Level } from '~/shared/types';

  interface Props {
    table: Array<ClassTable>;
    casterType: CasterType;
    features: Array<ClassFeature>;
    multiclass?: Array<ClassInMulticlass>;
  }

  const props = defineProps<Props>();

  interface MulticlassTableRow {
    level: Level;
    proficiencyBonus: number;
    features: Array<ClassFeature>;
    isSeparator?: boolean;
    separatorText?: string;

    [key: string]: string | number | Array<ClassFeature> | boolean | undefined;
  }

  interface HoverCell {
    rowIndex: number;
    columnIndex: number;
  }

  const hoveredCell = ref<HoverCell | null>(null);

  const debouncedCellHover = useDebounceFn(
    (rowIndex: number, columnIndex: number) => {
      hoveredCell.value = { rowIndex, columnIndex };
    },
    10,
  );

  const debouncedCellLeave = useDebounceFn(() => {
    hoveredCell.value = null;
  }, 10);

  const { scrollToAnchor } = useAnchorScroll();
  const route = useRoute();
  const router = useRouter();

  const { getProficiencyBonus } = useDndMechanics({
    casterType: props.casterType,
  });

  const features = computed(() => {
    const list: Array<ClassFeature> = [];

    for (const feature of props.features) {
      // Добавляем основное умение
      list.push(omit(feature, 'scaling'));

      // Добавляем scaling умения, если есть
      if (feature.scaling) {
        list.push(
          ...feature.scaling.map((scale) => ({
            key: feature.key,
            isSubclass: feature.isSubclass,
            ...scale,
          })),
        );
      }
    }

    return orderBy(list, ['level'], ['asc']);
  });

  // Определяем максимальный уровень персонажа из features
  const maxCharacterLevel = computed((): Level => {
    if (!features.value || features.value.length === 0) {
      return 20;
    }

    const maxLevel = Math.max(...features.value.map((f) => f.level));

    const clampedLevel = Math.min(Math.max(maxLevel, 1), 20);

    return LEVELS.find((level) => level === clampedLevel) ?? 20;
  });

  // Генерируем массив уровней персонажа
  const characterLevels = computed(() => {
    return LEVELS.filter((level) => level <= maxCharacterLevel.value);
  });

  function getScalingValueForLevel(
    level: Level,
    scalingArray: Array<{ level: number; value: string }> | undefined,
  ): string {
    if (!scalingArray?.length) return '—';

    const found = maxBy(
      scalingArray.filter((s) => s.level <= level),
      'level',
    );

    return found?.value ?? '—';
  }

  // Вычисляем, на каком уровне персонажа начинается каждый класс
  const classStartLevels = computed(() => {
    if (!props.multiclass || props.multiclass.length === 0) {
      return [];
    }

    const starts: Array<{ level: number; class: string; subclass?: string }> =
      [];

    let currentLevel = 1;

    for (const classItem of props.multiclass) {
      starts.push({
        level: currentLevel,
        class: classItem.class,
        subclass: classItem.subclass,
      });
      currentLevel += classItem.level;
    }

    return starts;
  });

  const tableData = computed(() => {
    const rows: Array<MulticlassTableRow> = [];

    for (const level of characterLevels.value) {
      // Проверяем, нужно ли добавить разделитель перед этим уровнем
      const separator = classStartLevels.value.find((s) => s.level === level);

      if (separator) {
        const separatorText = separator.subclass
          ? `${separator.class} / ${separator.subclass}`
          : separator.class;

        // Создаем разделитель с заполненными полями для всех столбцов
        const separatorRow: MulticlassTableRow = {
          level,
          proficiencyBonus: 0,
          features: [],
          isSeparator: true,
          separatorText,
        };

        // Заполняем поля для всех столбцов таблицы
        if (props.table && Array.isArray(props.table)) {
          props.table.forEach((tableColumn) => {
            separatorRow[tableColumn.name] = '';
          });
        }

        rows.push(separatorRow);
      }

      // Добавляем обычную строку с данными уровня
      rows.push(getLevelData(level));
    }

    return orderBy(rows, 'level');
  });

  function getLevelData(level: Level) {
    const levelFeatures = features.value.filter((f) => f.level === level);

    const row: MulticlassTableRow = {
      level,
      proficiencyBonus: getProficiencyBonus(level),
      features: levelFeatures,
    };

    if (props.table && Array.isArray(props.table)) {
      props.table.forEach((tableColumn) => {
        row[tableColumn.name] = getScalingValueForLevel(
          level,
          tableColumn.scaling,
        );
      });
    }

    return row;
  }

  const tableColumns = computed<ColumnDef<MulticlassTableRow>[]>(() => {
    const baseColumns: ColumnDef<MulticlassTableRow>[] = [
      {
        accessorKey: 'level',
        header: 'Ур.',
        cell: ({ row }) => row.original.level,
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      },
      {
        accessorKey: 'proficiencyBonus',
        header: 'БМ',
        cell: ({ row }) => `+${row.original.proficiencyBonus}`,
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      },
      {
        accessorKey: 'features',
        header: 'Умения класса',
        cell: ({ row }) => {
          const featuresInLevel = row.original.features;

          if (!featuresInLevel || featuresInLevel.length === 0) {
            return '—';
          }

          const featureLinks = featuresInLevel.map((feature, index) => {
            const link = h(
              'span',
              {
                class: [
                  feature.isSubclass
                    ? 'text-success hover:text-success'
                    : 'text-link hover:text-link',
                  'cursor-pointer transition-colors duration-100',
                  'hover:underline',
                ],
                onClick: withModifiers(() => {
                  scrollToAnchor(feature.key);

                  // Обновляем URL без перезагрузки страницы
                  if (route.hash !== `#${feature.key}`) {
                    router.replace({ hash: `#${feature.key}` });
                  }
                }, ['left', 'exact', 'prevent']),
              },
              feature.name,
            );

            return index < featuresInLevel.length - 1
              ? [link, h('span', ', ')]
              : link;
          });

          return h('span', featureLinks.flat());
        },
        meta: {
          class: {
            th: 'text-left min-w-48',
            td: 'text-left min-w-48',
          },
        },
      },
    ];

    if (props.table && Array.isArray(props.table)) {
      props.table.forEach((tableColumn) => {
        baseColumns.push({
          accessorKey: tableColumn.name,
          header: tableColumn.name,
          cell: ({ row }) => row.original[tableColumn.name] ?? '—',
          meta: {
            class: {
              th: 'max-w-28 text-center',
              td: 'max-w-28 text-center',
            },
          },
        });
      });
    }

    return baseColumns;
  });

  const vueTable = useVueTable({
    get data() {
      return tableData.value;
    },
    get columns() {
      return tableColumns.value;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  function getHeaderClass(header: Header<MulticlassTableRow, unknown>): string {
    const baseClass =
      'p-2 text-xs border-b border-default text-center text-highlighted';

    const metaClass = header.column.columnDef.meta?.class?.th || '';

    return `${baseClass} ${metaClass}`;
  }

  function getCellClass(
    cell: Cell<MulticlassTableRow, unknown>,
    rowIndex: number,
    columnIndex: number,
  ): string {
    const baseClass =
      'py-1 px-2 text-xs text-default transition-colors duration-100';

    const metaClass = cell.column.columnDef.meta?.class?.td || '';

    let hoverClass = '';

    if (hoveredCell.value) {
      const { rowIndex: hoveredRow, columnIndex: hoveredColumn } =
        hoveredCell.value;

      if (rowIndex === hoveredRow && columnIndex === hoveredColumn) {
        hoverClass = 'bg-accented/60';
      } else if (rowIndex === hoveredRow || columnIndex === hoveredColumn) {
        hoverClass = 'bg-accented/40';
      }
    }

    return `${baseClass} ${metaClass} ${hoverClass}`;
  }
</script>

<template>
  <div class="w-full overflow-x-auto rounded-lg border border-default bg-muted">
    <table class="min-w-full table-fixed border-collapse">
      <thead class="bg-elevated">
        <tr
          v-for="headerGroup in vueTable.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            :colspan="header.colSpan"
            :rowspan="1"
            :class="getHeaderClass(header)"
          >
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-default">
        <tr
          v-for="(row, rowIndex) in vueTable.getRowModel().rows"
          :key="row.id"
          :class="[
            'divide-x divide-default',
            row.original.isSeparator ? 'bg-elevated font-medium' : '',
          ]"
        >
          <template v-if="row.original.isSeparator">
            <td
              :colspan="vueTable.getAllColumns().length"
              class="px-4 py-1.5 text-left text-xs text-secondary"
            >
              {{ row.original.separatorText }}
            </td>
          </template>

          <template v-else>
            <td
              v-for="(cell, columnIndex) in row.getVisibleCells()"
              :key="cell.id"
              :class="getCellClass(cell, rowIndex, columnIndex)"
              @mouseenter="debouncedCellHover(rowIndex, columnIndex)"
              @mouseleave="debouncedCellLeave"
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
