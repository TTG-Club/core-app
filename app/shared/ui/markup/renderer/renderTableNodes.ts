import { h, type VNode } from 'vue';
import type { TableNode, TableRow, RenderNode, TableAlign } from '../types';
import { UTable } from '#components';

type Deps = {
  renderNode: (n: RenderNode) => VNode;
  toNodes: (i: RenderNode | string) => RenderNode[];
};

type ColumnDef = {
  key: string;
  label: string;
  class?: string;
  rowClass?: string;
  sortable?: boolean;
};

export function renderTableNode(node: TableNode, deps: Deps): VNode {
  const attrs = node.attrs ?? {};
  const rowsSrc = node.rows ?? [];

  // 1) Определяем число колонок (максимум по строкам)
  const colCount = rowsSrc.reduce((m, r) => Math.max(m, r.cells.length), 0);

  // 2) Заголовки: если первая строка header (row.header или все cell.header), берём её как label’ы
  const headerRow = rowsSrc.find(
    (r) => r.header || r.cells.every((c) => !!c.header),
  );

  const labels: string[] = [];

  for (let i = 0; i < colCount; i++) {
    const labelCell = headerRow?.cells[i];
    // собираем label из контента ячейки (только текстовые куски; если нужно — можно сделать богаче)

    const labelText =
      labelCell?.content
        ?.map((chunk) => {
          if (Array.isArray(chunk)) return '';

          return typeof chunk === 'string' ? chunk : '';
        })
        .join('')
        .trim() || `#${i + 1}`;

    labels.push(labelText);
  }

  // 3) Колонки UTable
  const columns: ColumnDef[] = Array.from({ length: colCount }).map((_, i) => {
    const align = (attrs.colAlign && attrs.colAlign[i]) || 'left';

    const alignClass =
      align === 'center'
        ? 'text-center'
        : align === 'right'
          ? 'text-right'
          : 'text-left';

    return {
      key: `c${i}`,
      label: labels[i] ?? `#${i + 1}`,
      class: alignClass,
      rowClass: alignClass,
    };
  });

  // 4) Данные строк: UTable требует массив объектов; положим исходную строку внутрь
  //    и одновременно сделаем поля c0..cN (их «наполнит» слот).
  const bodyRows = rowsSrc
    .filter((r) => !(r.header || r.cells.every((c) => !!c.header))) // исключим header-строки — их отрисуем в <thead> через labels
    .map((r, ri) => {
      const rowObj: Record<string, unknown> = { __row: r, __ri: ri };

      for (let i = 0; i < colCount; i++) rowObj[`c${i}`] = null;

      return rowObj;
    });

  // 5) Слоты для колонок: `${key}-data` → строим VNode ячейки по исходному TableRow/TableCell
  const slots: Record<string, (scope: any) => VNode[]> = {};

  columns.forEach((col, ci) => {
    const slotKey = `${col.key}-data`;

    slots[slotKey] = ({ row }: { row: Record<string, unknown> }) => {
      const srcRow = row.__row as TableRow | undefined;

      if (!srcRow) return [h('span')];

      const cell = srcRow.cells[ci];

      if (!cell) return [h('span')];

      // Выравнивание ячейки с приоритетами: cell > row > table
      const align: TableAlign | undefined =
        cell.align ??
        srcRow.align ??
        (attrs.colAlign && attrs.colAlign[ci]) ??
        'left';

      const alignClass =
        align === 'center'
          ? 'text-center'
          : align === 'right'
            ? 'text-right'
            : 'text-left';

      const padClass = attrs.dense ? 'px-2 py-1' : 'px-3 py-2';

      const tdClass = [
        padClass,
        alignClass,
        attrs.bordered ? 'border border-gray-300' : '',
        'align-top',
      ]
        .filter(Boolean)
        .join(' ');

      // Контент: строки прогоняем через deps.toNodes → parse, массивы — «батчи» одного td
      const parts: VNode[] = [];
      const chunks = cell.content ?? [];

      for (const chunk of chunks) {
        if (Array.isArray(chunk)) {
          const nodes = chunk.flatMap((part) => deps.toNodes(part));

          parts.push(...nodes.map((n) => deps.renderNode(n)));
        } else {
          const nodes = deps.toNodes(chunk);

          parts.push(...nodes.map((n) => deps.renderNode(n)));
        }
      }

      // Внутри <td> контент уже рендерит UTable, мы отдаём фрагмент
      return [
        h(
          'div',
          {
            class: tdClass,
            style: {
              padding: attrs.dense ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
            },
          },
          parts,
        ),
      ];
    };
  });

  // 6) Пропсы UTable
  const tableUi = {
    // добавим бордеры/зебру и схлопывание/скролл — Nuxt UI часть уже делает,
    // мы лишь слегка корректируем классы ячеек через slots
  };

  // 7) Рендер UTable
  return h(
    UTable as any,
    {
      columns,
      rows: bodyRows,
      // опционально: передай ui-пропы, если нужно
      ui: tableUi,
    },
    slots,
  );
}
