<script setup lang="ts">
  import { computed, h, ref, withModifiers } from 'vue';
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
    class1Features: Array<ClassFeature>;
    class2Features: Array<ClassFeature>;
    class1TableData?: Record<string, string>;
    class2TableData?: Record<string, string>;
    class1SpellSlots?: Record<string, string | number>;
    class2SpellSlots?: Record<string, string | number>;
    multiclassSpellSlots?: Record<string, string | number>;
    class1PactSlotsCount?: number;
    class1PactSlotsLevel?: number;
    class2PactSlotsCount?: number;
    class2PactSlotsLevel?: number;
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
    Math.max(data.class1.level, data.class2.level),
  );

  // Расчет уровня заклинателя по правилам мультиклассирования D&D 5
  const spellcasterLevel = computed(() => {
    let fullCasterLevel = 0;
    let halfCasterLevel = 0;
    let thirdCasterLevel = 0;
    let hasPact = false;

    // Класс 1
    if (data.class1.detail.casterType === CasterType.FULL) {
      fullCasterLevel += data.class1.level;
    } else if (data.class1.detail.casterType === CasterType.HALF) {
      halfCasterLevel += data.class1.level;
    } else if (data.class1.detail.casterType === CasterType.THIRD) {
      thirdCasterLevel += data.class1.level;
    } else if (data.class1.detail.casterType === CasterType.PACT) {
      hasPact = true;
    }

    // Класс 2
    if (data.class2.detail.casterType === CasterType.FULL) {
      fullCasterLevel += data.class2.level;
    } else if (data.class2.detail.casterType === CasterType.HALF) {
      halfCasterLevel += data.class2.level;
    } else if (data.class2.detail.casterType === CasterType.THIRD) {
      thirdCasterLevel += data.class2.level;
    } else if (data.class2.detail.casterType === CasterType.PACT) {
      hasPact = true;
    }

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
  const class1Mechanics = useDndMechanics({
    casterType: data.class1.detail.casterType,
  });

  const class2Mechanics = useDndMechanics({
    casterType: data.class2.detail.casterType,
  });

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
        class1Features: [],
        class2Features: [],
        class1TableData: {},
        class2TableData: {},
        class1SpellSlots: {},
        class2SpellSlots: {},
        multiclassSpellSlots: {},
      };

      // Особенности класса 1
      if (level <= data.class1.level) {
        row.class1Features = getClassFeatures(
          data.class1.detail.features,
          level,
        );

        // Данные таблицы класса 1
        if (data.class1.detail.table) {
          data.class1.detail.table.forEach((tableColumn) => {
            row.class1TableData![tableColumn.name] = getScalingValueForLevel(
              level,
              tableColumn.scaling,
            );
          });
        }

        // Заклинания класса 1 (только для пактовых заклинаний)
        if (
          class1Mechanics.isSpellcaster.value &&
          class1Mechanics.isPactSpellcaster.value
        ) {
          row.class1PactSlotsCount = PACT_CASTER_SPELL_SLOTS_COUNT[level];
          row.class1PactSlotsLevel = PACT_CASTER_SPELL_SLOTS_LEVEL[level];
        }
      }

      // Особенности класса 2
      if (level <= data.class2.level) {
        row.class2Features = getClassFeatures(
          data.class2.detail.features,
          level,
        );

        // Данные таблицы класса 2
        if (data.class2.detail.table) {
          data.class2.detail.table.forEach((tableColumn) => {
            row.class2TableData![tableColumn.name] = getScalingValueForLevel(
              level,
              tableColumn.scaling,
            );
          });
        }

        // Заклинания класса 2 (только для пактовых заклинаний)
        if (
          class2Mechanics.isSpellcaster.value &&
          class2Mechanics.isPactSpellcaster.value
        ) {
          row.class2PactSlotsCount = PACT_CASTER_SPELL_SLOTS_COUNT[level];
          row.class2PactSlotsLevel = PACT_CASTER_SPELL_SLOTS_LEVEL[level];
        }
      }

      // Общие ячейки заклинаний для мультиклассового заклинателя (если есть хотя бы один класс с магией)
      const hasAnyRegularSpellcaster =
        (class1Mechanics.isSpellcaster.value &&
          !class1Mechanics.isPactSpellcaster.value) ||
        (class2Mechanics.isSpellcaster.value &&
          !class2Mechanics.isPactSpellcaster.value);

      if (hasAnyRegularSpellcaster) {
        // Рассчитываем уровень заклинателя на текущем уровне персонажа
        // Нужно определить, сколько уровней каждого класса у персонажа на этом уровне персонажа
        let class1LevelAtCharacterLevel = 0;
        let class2LevelAtCharacterLevel = 0;

        // Определяем распределение уровней классов на текущем уровне персонажа
        // Предполагаем, что сначала берутся уровни класса 1, затем класса 2
        if (level <= data.class1.level) {
          class1LevelAtCharacterLevel = level;
        } else {
          class1LevelAtCharacterLevel = data.class1.level;
          class2LevelAtCharacterLevel = level - data.class1.level;
        }

        if (
          level > data.class1.level &&
          level <= data.class1.level + data.class2.level
        ) {
          class2LevelAtCharacterLevel = level - data.class1.level;
        } else if (level <= data.class1.level) {
          class2LevelAtCharacterLevel = 0;
        } else {
          class2LevelAtCharacterLevel = data.class2.level;
        }

        // Рассчитываем уровень заклинателя на основе уровней классов на текущем уровне персонажа
        let fullCasterLevel = 0;
        let halfCasterLevel = 0;
        let thirdCasterLevel = 0;

        if (class1LevelAtCharacterLevel > 0) {
          if (data.class1.detail.casterType === CasterType.FULL) {
            fullCasterLevel += class1LevelAtCharacterLevel;
          } else if (data.class1.detail.casterType === CasterType.HALF) {
            halfCasterLevel += class1LevelAtCharacterLevel;
          } else if (data.class1.detail.casterType === CasterType.THIRD) {
            thirdCasterLevel += class1LevelAtCharacterLevel;
          }
        }

        if (class2LevelAtCharacterLevel > 0) {
          if (data.class2.detail.casterType === CasterType.FULL) {
            fullCasterLevel += class2LevelAtCharacterLevel;
          } else if (data.class2.detail.casterType === CasterType.HALF) {
            halfCasterLevel += class2LevelAtCharacterLevel;
          } else if (data.class2.detail.casterType === CasterType.THIRD) {
            thirdCasterLevel += class2LevelAtCharacterLevel;
          }
        }

        // По правилам D&D 5: каждый компонент округляется вниз отдельно, затем суммируется
        const fullContribution = fullCasterLevel;
        const halfContribution = Math.floor(halfCasterLevel / 2);
        const thirdContribution = Math.floor(thirdCasterLevel / 3);

        const casterLevelAtThisLevel = Math.min(
          fullContribution + halfContribution + thirdContribution,
          20,
        ) as Level;

        if (casterLevelAtThisLevel > 0) {
          const levelSpellSlots =
            MULTICLASS_SPELL_SLOTS[casterLevelAtThisLevel];

          levelSpellSlots.forEach((slotCount, slotIndex) => {
            row.multiclassSpellSlots![`spell${slotIndex + 1}`] =
              slotCount > 0 ? slotCount : '—';
          });
        }
      }

      rows.push(row);
    });

    return rows;
  });

  const class1Name = computed(() => {
    if (data.class1.subclassUrl && data.class1.detail.parent) {
      return `${data.class1.detail.parent.name.rus} / ${data.class1.detail.name.rus}`;
    }

    return data.class1.detail.name.rus;
  });

  const class2Name = computed(() => {
    if (data.class2.subclassUrl && data.class2.detail.parent) {
      return `${data.class2.detail.parent.name.rus} / ${data.class2.detail.name.rus}`;
    }

    return data.class2.detail.name.rus;
  });

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
          const class1Features = row.original.class1Features || [];
          const class2Features = row.original.class2Features || [];

          const allFeatures: Array<{
            feature: ClassFeature;
            className: string;
          }> = [];

          // Добавляем умения класса 1
          if (row.original.level <= data.class1.level) {
            class1Features.forEach((feature) => {
              allFeatures.push({ feature, className: class1Name.value });
            });
          }

          // Добавляем умения класса 2
          if (row.original.level <= data.class2.level) {
            class2Features.forEach((feature) => {
              allFeatures.push({ feature, className: class2Name.value });
            });
          }

          if (allFeatures.length === 0) {
            return '—';
          }

          const featureLinks = allFeatures.map((item, index) => {
            const { feature } = item;

            const link = h(
              'a',
              {
                href: `#${feature.key}`,
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
                      const newUrl = `${pathname}${search}#${feature.key}`;

                      window.history.pushState(null, '', newUrl);
                    }

                    scrollToAnchor(feature.key);
                  },
                  ['left', 'exact'],
                ),
              },
              feature.name,
            );

            const separator =
              index < allFeatures.length - 1 ? h('span', ', ') : null;

            return [link, separator];
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

    // Добавляем колонки данных таблицы - группируем по классам
    // Класс 1
    if (
      data.class1.detail.table &&
      Array.isArray(data.class1.detail.table) &&
      data.class1.detail.table.length > 0
    ) {
      baseColumns.push({
        id: `class1_table`,
        header: () => h('span', { class: 'text-xs' }, class1Name.value),
        meta: {
          class: {
            th: 'text-left',
          },
        },
        columns: data.class1.detail.table.map((tableColumn) => ({
          accessorKey: `class1_${tableColumn.name}`,
          header: () => h('span', { class: 'text-xs' }, tableColumn.name),
          cell: ({ row }) => {
            if (row.original.level <= data.class1.level) {
              return row.original.class1TableData?.[tableColumn.name] ?? '—';
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

    // Класс 2
    if (
      data.class2.detail.table &&
      Array.isArray(data.class2.detail.table) &&
      data.class2.detail.table.length > 0
    ) {
      baseColumns.push({
        id: `class2_table`,
        header: () => h('span', { class: 'text-xs' }, class2Name.value),
        meta: {
          class: {
            th: 'text-left',
          },
        },
        columns: data.class2.detail.table.map((tableColumn) => ({
          accessorKey: `class2_${tableColumn.name}`,
          header: () => h('span', { class: 'text-xs' }, tableColumn.name),
          cell: ({ row }) => {
            if (row.original.level <= data.class2.level) {
              return row.original.class2TableData?.[tableColumn.name] ?? '—';
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

    // Ячейки заклинаний для мультиклассового заклинателя (общая таблица)
    const hasAnyRegularSpellcaster =
      (class1Mechanics.isSpellcaster.value &&
        !class1Mechanics.isPactSpellcaster.value) ||
      (class2Mechanics.isSpellcaster.value &&
        !class2Mechanics.isPactSpellcaster.value);

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
    const hasClass1PactSpells =
      class1Mechanics.isSpellcaster.value &&
      class1Mechanics.isPactSpellcaster.value;

    const hasClass2PactSpells =
      class2Mechanics.isSpellcaster.value &&
      class2Mechanics.isPactSpellcaster.value;

    if (hasClass1PactSpells || hasClass2PactSpells) {
      baseColumns.push({
        id: 'pactSlotsCount',
        header: 'Кол-во ячеек',
        cell: ({ row }) => {
          const class1Value = row.original.class1PactSlotsCount;
          const class2Value = row.original.class2PactSlotsCount;

          const parts: Array<string> = [];

          if (class1Value !== undefined) {
            parts.push(`${class1Value} (${class1Name.value})`);
          }

          if (class2Value !== undefined) {
            parts.push(`${class2Value} (${class2Name.value})`);
          }

          if (parts.length === 0) {
            return '—';
          }

          return parts.join(', ');
        },
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      });

      baseColumns.push({
        id: 'pactSlotsLevel',
        header: 'Ур. ячейки',
        cell: ({ row }) => {
          const class1Value = row.original.class1PactSlotsLevel;
          const class2Value = row.original.class2PactSlotsLevel;

          const parts: Array<string> = [];

          if (class1Value !== undefined) {
            parts.push(`${class1Value} (${class1Name.value})`);
          }

          if (class2Value !== undefined) {
            parts.push(`${class2Value} (${class2Name.value})`);
          }

          if (parts.length === 0) {
            return '—';
          }

          return parts.join(', ');
        },
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      });
    }

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
    const hasSpellSlots =
      (class1Mechanics.isSpellcaster.value &&
        class1Mechanics.isRegularSpellcaster.value) ||
      (class2Mechanics.isSpellcaster.value &&
        class2Mechanics.isRegularSpellcaster.value);

    const hasGroupedColumns =
      (data.class1.detail.table && data.class1.detail.table.length > 0) ||
      (data.class2.detail.table && data.class2.detail.table.length > 0);

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
    const hasSpellSlots =
      (class1Mechanics.isSpellcaster.value &&
        class1Mechanics.isRegularSpellcaster.value) ||
      (class2Mechanics.isSpellcaster.value &&
        class2Mechanics.isRegularSpellcaster.value);

    const hasGroupedColumns =
      (data.class1.detail.table && data.class1.detail.table.length > 0) ||
      (data.class2.detail.table && data.class2.detail.table.length > 0);

    if (!hasSpellSlots && !hasGroupedColumns) {
      return 1;
    }

    let rowSpan = 1;

    if (header.isPlaceholder) {
      const leafs = header.getLeafHeaders();

      if (leafs.length > 0) {
        const lastLeaf = leafs[leafs.length - 1];

        if (lastLeaf) {
          rowSpan = lastLeaf.depth - header.depth;
        }
      }
    }

    return rowSpan;
  }

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
