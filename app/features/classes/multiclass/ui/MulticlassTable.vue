<script setup lang="ts">
  import { computed, h, ref, shallowRef, watch, withModifiers } from 'vue';
  import type { Cell, ColumnDef, Header } from '@tanstack/vue-table';
  import {
    FlexRender,
    getCoreRowModel,
    useVueTable,
  } from '@tanstack/vue-table';
  import { useDebounceFn } from '@vueuse/core';
  import { maxBy, omit, orderBy, range } from 'lodash-es';
  import { LEVELS } from '~/shared/consts';
  import type { Level } from '~/shared/types';
  import { CasterType, type ClassFeature } from '~classes/types';
  import { useDndMechanics } from '~classes/body/ui/table/useDndMechanics';
  import {
    PACT_CASTER_SPELL_SLOTS_COUNT,
    PACT_CASTER_SPELL_SLOTS_LEVEL,
  } from '~classes/body/ui/table/const';
  import { MULTICLASS_SPELL_SLOTS } from '~classes/body/ui/table/multiclassSpellSlots';
  import type { MulticlassData } from '../types';

  const { data } = defineProps<{
    data: MulticlassData;
  }>();

  interface MulticlassTableRow {
    level: Level;
    proficiencyBonus: number;
    classFeatures: Array<Array<ClassFeature>>;
    classTableData: Array<Record<string, string>>;
    classSpellSlots: Array<Record<string, string | number>>;
    multiclassSpellSlots?: Record<string, string | number>;
    classPactSlotsCount: Array<number | undefined>;
    classPactSlotsLevel: Array<number | undefined>;
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

  const maxLevel = computed(() =>
    Math.max(...data.classes.map((c) => c.level)),
  );

  // Расчет уровня заклинателя по правилам мультиклассирования D&D 5
  const spellcasterLevel = computed(() => {
    let fullCasterLevel = 0;
    let halfCasterLevel = 0;
    let thirdCasterLevel = 0;
    let hasPact = false;

    data.classes.forEach((classItem) => {
      if (classItem.detail.casterType === CasterType.FULL) {
        fullCasterLevel += classItem.level;
      } else if (classItem.detail.casterType === CasterType.HALF) {
        halfCasterLevel += classItem.level;
      } else if (classItem.detail.casterType === CasterType.THIRD) {
        thirdCasterLevel += classItem.level;
      } else if (classItem.detail.casterType === CasterType.PACT) {
        hasPact = true;
      }
    });

    // По правилам D&D 5: каждый компонент округляется вниз отдельно, затем суммируется
    const fullContribution = fullCasterLevel;
    const halfContribution = Math.floor(halfCasterLevel / 2);
    const thirdContribution = Math.floor(thirdCasterLevel / 3);

    const calculatedLevel =
      fullContribution + halfContribution + thirdContribution;

    return {
      level: calculatedLevel,
      hasPact,
    };
  });

  // Механика заклинаний для каждого класса
  const classMechanics = shallowRef(
    data.classes.map((c) =>
      useDndMechanics({
        casterType: c.detail.casterType,
      }),
    ),
  );

  // Обновляем механику при изменении классов
  watch(
    () => data.classes,
    () => {
      classMechanics.value = data.classes.map((c) =>
        useDndMechanics({
          casterType: c.detail.casterType,
        }),
      );
    },
    { deep: true },
  );

  // Получение особенностей для класса
  function getClassFeatures(
    features: Array<ClassFeature>,
    level: Level,
  ): Array<ClassFeature> {
    const list: Array<ClassFeature> = [];

    for (const feature of features) {
      if (feature.level <= level) {
        list.push(omit(feature, 'scaling'));

        if (feature.scaling) {
          list.push(
            ...feature.scaling
              .filter((scale) => scale.level <= level)
              .map((scale) => ({
                key: feature.key,
                isSubclass: feature.isSubclass,
                ...scale,
              })),
          );
        }
      }
    }

    return orderBy(list, ['level'], ['asc']).filter((f) => f.level === level);
  }

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

  const tableData = computed(() => {
    const rows: Array<MulticlassTableRow> = [];

    LEVELS.filter((level) => level <= maxLevel.value).forEach((level) => {
      const proficiencyBonus = Math.floor((level - 1) / 4) + 2;

      const row: MulticlassTableRow = {
        level,
        proficiencyBonus,
        classFeatures: [],
        classTableData: [],
        classSpellSlots: [],
        multiclassSpellSlots: {},
        classPactSlotsCount: [],
        classPactSlotsLevel: [],
      };

      // Инициализируем массивы для всех классов
      data.classes.forEach(() => {
        row.classFeatures.push([]);
        row.classTableData.push({});
        row.classSpellSlots.push({});
        row.classPactSlotsCount.push(undefined);
        row.classPactSlotsLevel.push(undefined);
      });

      // Особенности и данные для каждого класса
      data.classes.forEach((classItem, index) => {
        if (level <= classItem.level) {
          row.classFeatures[index] = getClassFeatures(
            classItem.detail.features,
            level,
          );

          // Данные таблицы класса
          if (classItem.detail.table) {
            classItem.detail.table.forEach((tableColumn) => {
              if (row.classTableData[index]) {
                row.classTableData[index][tableColumn.name] =
                  getScalingValueForLevel(level, tableColumn.scaling);
              }
            });
          }

          // Заклинания класса (только для пактовых заклинаний)
          const mechanics = classMechanics.value[index];

          if (
            mechanics &&
            mechanics.isSpellcaster.value &&
            mechanics.isPactSpellcaster.value
          ) {
            row.classPactSlotsCount[index] =
              PACT_CASTER_SPELL_SLOTS_COUNT[level];

            row.classPactSlotsLevel[index] =
              PACT_CASTER_SPELL_SLOTS_LEVEL[level];
          }
        }
      });

      // Расчет уровня заклинателя на основе уровней классов на текущем уровне персонажа
      let fullCasterLevel = 0;
      let halfCasterLevel = 0;
      let thirdCasterLevel = 0;

      data.classes.forEach((classItem) => {
        const classLevelAtCharacterLevel = Math.min(level, classItem.level);

        if (classLevelAtCharacterLevel > 0) {
          if (classItem.detail.casterType === CasterType.FULL) {
            fullCasterLevel += classLevelAtCharacterLevel;
          } else if (classItem.detail.casterType === CasterType.HALF) {
            halfCasterLevel += classLevelAtCharacterLevel;
          } else if (classItem.detail.casterType === CasterType.THIRD) {
            thirdCasterLevel += classLevelAtCharacterLevel;
          }
        }
      });

      // По правилам D&D 5: каждый компонент округляется вниз отдельно, затем суммируется
      const fullContribution = fullCasterLevel;
      const halfContribution = Math.floor(halfCasterLevel / 2);
      const thirdContribution = Math.floor(thirdCasterLevel / 3);

      const casterLevelAtThisLevel = Math.min(
        fullContribution + halfContribution + thirdContribution,
        20,
      ) as Level;

      // Общие ячейки заклинаний для мультиклассового заклинателя (если есть хотя бы один класс с магией)
      const hasAnyRegularSpellcaster = data.classes.some((c, index) => {
        const mechanics = classMechanics.value[index];

        return (
          mechanics &&
          mechanics.isSpellcaster.value &&
          !mechanics.isPactSpellcaster.value
        );
      });

      if (hasAnyRegularSpellcaster && casterLevelAtThisLevel > 0) {
        const levelSpellSlots = MULTICLASS_SPELL_SLOTS[casterLevelAtThisLevel];

        if (!row.multiclassSpellSlots) {
          row.multiclassSpellSlots = {};
        }

        levelSpellSlots.forEach((slotCount, slotIndex) => {
          row.multiclassSpellSlots![`spell${slotIndex + 1}`] =
            slotCount > 0 ? slotCount : '—';
        });
      }

      rows.push(row);
    });

    return rows;
  });

  const classNames = computed(() =>
    data.classes.map((c) => {
      if (c.subclassUrl && c.detail.parent) {
        return `${c.detail.parent.name.rus} / ${c.detail.name.rus}`;
      }

      return c.detail.name.rus;
    }),
  );

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
          const allFeatures: Array<{
            feature: ClassFeature;
            className: string;
          }> = [];

          data.classes.forEach((classItem, index) => {
            if (row.original.level <= classItem.level) {
              if (row.original.classFeatures[index]) {
                const className = classNames.value[index];

                if (className) {
                  row.original.classFeatures[index].forEach((feature) => {
                    allFeatures.push({ feature, className });
                  });
                }
              }
            }
          });

          if (!allFeatures || allFeatures.length === 0) {
            return '—';
          }

          const featureLinks = allFeatures
            .map((item, index) => {
              const { feature } = item;

              if (!feature.key || !feature.name) {
                return null;
              }

              const featureKey = feature.key;
              const featureName = feature.name;

              const link = h(
                'a',
                {
                  href: `#${featureKey}`,
                  class: [
                    feature.isSubclass
                      ? 'text-success hover:text-success'
                      : 'text-primary hover:text-primary/75',
                    'transition-colors duration-100 cursor-pointer hover:underline',
                  ],
                  onClick: withModifiers(
                    (e: Event) => {
                      e.preventDefault();

                      // Обновляем hash через history API, сохраняя query параметры
                      if (import.meta.client) {
                        const pathname = window.location.pathname;
                        const search = window.location.search;
                        const newUrl = `${pathname}${search}#${featureKey}`;

                        window.history.pushState(null, '', newUrl);
                      }

                      scrollToAnchor(featureKey);
                    },
                    ['left', 'exact'],
                  ),
                },
                featureName,
              );

              const separator =
                index < allFeatures.length - 1 ? h('span', ', ') : null;

              return [link, separator];
            })
            .filter(
              (
                item,
              ): item is [ReturnType<typeof h>, ReturnType<typeof h> | null] =>
                item !== null,
            );

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

    // Добавляем колонки данных таблицы - группируем по классам
    data.classes.forEach((classItem, index) => {
      if (
        classItem.detail.table &&
        Array.isArray(classItem.detail.table) &&
        classItem.detail.table.length > 0
      ) {
        baseColumns.push({
          id: `class${index + 1}_table`,
          header: () =>
            h('span', { class: 'text-xs' }, classNames.value[index]),
          meta: {
            class: {
              th: 'text-left',
            },
          },
          columns: classItem.detail.table.map((tableColumn) => ({
            accessorKey: `class${index + 1}_${tableColumn.name}`,
            header: () => h('span', { class: 'text-xs' }, tableColumn.name),
            cell: ({ row }) => {
              if (row.original.level <= classItem.level) {
                return (
                  row.original.classTableData[index]?.[tableColumn.name] ?? '—'
                );
              }

              return '—';
            },
            meta: {
              class: {
                th: 'max-w-28 text-center',
                td: 'max-w-28 text-center',
              },
            },
          })),
        });
      }
    });

    // Ячейки заклинаний для мультиклассового заклинателя (общая таблица)
    const hasAnyRegularSpellcaster = data.classes.some((c, index) => {
      const mechanics = classMechanics.value?.[index];

      return (
        mechanics &&
        mechanics.isSpellcaster.value &&
        !mechanics.isPactSpellcaster.value
      );
    });

    if (hasAnyRegularSpellcaster && spellcasterLevel.value.level > 0) {
      baseColumns.push({
        id: 'spellSlots',
        header: 'Ячейки заклинаний',
        columns: range(1, 10).map((slotLevel) => ({
          accessorKey: `spell${slotLevel}`,
          header: `${slotLevel}`,
          cell: ({ row }) =>
            row.original.multiclassSpellSlots?.[`spell${slotLevel}`] ?? '—',
          meta: {
            class: {
              th: 'w-8 text-center',
              td: 'w-8 text-center',
            },
          },
        })),
      });
    }

    // Пактовые заклинания
    data.classes.forEach((classItem, index) => {
      const mechanics = classMechanics.value?.[index];

      if (
        mechanics &&
        mechanics.isSpellcaster.value &&
        mechanics.isPactSpellcaster.value
      ) {
        baseColumns.push({
          id: `pactSlotsCount_${index + 1}`,
          header: () =>
            h(
              'span',
              { class: 'text-xs' },
              `Кол-во ячеек (${classNames.value[index]})`,
            ),
          cell: ({ row }) => row.original.classPactSlotsCount[index] ?? '—',
          meta: {
            class: {
              th: 'w-8 text-center',
              td: 'w-8 text-center',
            },
          },
        });

        baseColumns.push({
          id: `pactSlotsLevel_${index + 1}`,
          header: () =>
            h(
              'span',
              { class: 'text-xs' },
              `Ур. ячейки (${classNames.value[index]})`,
            ),
          cell: ({ row }) => row.original.classPactSlotsLevel[index] ?? '—',
          meta: {
            class: {
              th: 'w-8 text-center',
              td: 'w-8 text-center',
            },
          },
        });
      }
    });

    return baseColumns;
  });

  const table = useVueTable({
    get data() {
      return tableData.value;
    },
    get columns() {
      return tableColumns.value;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  function shouldShowHeader(
    header: Header<MulticlassTableRow, unknown>,
  ): boolean {
    const hasSpellSlots = data.classes.some((c, index) => {
      const mechanics = classMechanics.value?.[index];

      return (
        mechanics &&
        mechanics.isSpellcaster.value &&
        mechanics.isRegularSpellcaster.value
      );
    });

    const hasGroupedColumns = data.classes.some(
      (c) => c.detail.table && c.detail.table.length > 0,
    );

    if (!hasSpellSlots && !hasGroupedColumns) {
      return true;
    }

    const columnRelativeDepth = header.depth - header.column.depth;

    return !(
      !header.isPlaceholder &&
      columnRelativeDepth > 1 &&
      header.id === header.column.id
    );
  }

  function getRowSpan(header: Header<MulticlassTableRow, unknown>): number {
    const hasSpellSlots = data.classes.some((c, index) => {
      const mechanics = classMechanics.value?.[index];

      return (
        mechanics &&
        mechanics.isSpellcaster.value &&
        mechanics.isRegularSpellcaster.value
      );
    });

    const hasGroupedColumns = data.classes.some(
      (c) => c.detail.table && c.detail.table.length > 0,
    );

    if (!hasSpellSlots && !hasGroupedColumns) {
      return 1;
    }

    let rowSpan = 1;

    if (header.isPlaceholder) {
      const leafs = header.getLeafHeaders();

      if (leafs.length > 0) {
        const lastLeaf = leafs[leafs.length - 1];

        if (lastLeaf && lastLeaf.depth !== undefined) {
          rowSpan = lastLeaf.depth - header.depth;
        }
      }
    }

    return rowSpan;
  }

  function getHeaderClass(header: Header<MulticlassTableRow, unknown>): string {
    const baseClass =
      'p-2 text-xs border-b border-default text-center text-highlighted';

    const metaClass =
      (header.column.columnDef.meta as { class?: { th?: string } })?.class
        ?.th || '';

    return `${baseClass} ${metaClass}`;
  }

  function getCellClass(
    cell: Cell<MulticlassTableRow, unknown>,
    rowIndex: number,
    columnIndex: number,
  ): string {
    const baseClass =
      'py-1 px-2 text-xs text-default transition-colors duration-100';

    const metaClass =
      (cell.column.columnDef.meta as { class?: { td?: string } })?.class?.td ||
      '';

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
  <div class="flex flex-col gap-2">
    <div
      class="w-full overflow-x-auto rounded-lg border border-default bg-muted"
    >
      <table class="min-w-full border-collapse">
        <thead class="bg-elevated">
          <template
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <tr>
              <th
                v-for="header in headerGroup.headers"
                v-show="shouldShowHeader(header)"
                :key="header.id"
                :colspan="header.colSpan"
                :rowspan="getRowSpan(header)"
                :class="getHeaderClass(header)"
              >
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </th>
            </tr>
          </template>
        </thead>

        <tbody class="divide-y divide-default">
          <tr
            v-for="(row, rowIndex) in table.getRowModel().rows"
            :key="row.id"
            class="divide-x divide-default"
          >
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
