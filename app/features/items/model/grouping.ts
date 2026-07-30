import type { GroupNode } from '~ui/grouped-list';

import type { ItemCategory, ItemType } from './create';
import type { ItemLinkResponse } from './link';

import {
  ITEM_GROUP_ROOTS,
  ITEM_OTHER_GROUP_KEY,
  ITEM_OTHER_GROUP_LABEL,
} from './constants';

/** Ветвь иерархии типов предметов: тип и его подтипы. */
export interface ItemGroupBranch {
  /** Тип предмета, по которому отбираются предметы ветви. */
  type: ItemType;

  /**
   * Своя подпись группы вместо словарной. Нужна там, где подпись зависит от
   * родителя: «Простое» + «Рукопашное оружие» по-русски не склеиваются
   * механически, а «Рукопашное оружие» под двумя родителями неоднозначно.
   */
  label?: string;

  /** Подтипы внутри ветви в порядке вывода. */
  children: Array<ItemGroupBranch>;
}

/** Корень иерархии: категория предмета с ветвями типов. */
export interface ItemGroupRoot {
  /** Категория предмета, по которой отбираются предметы корня. */
  category: ItemCategory;

  /** Подпись корневой группы: категорий в словаре фильтров нет. */
  label: string;

  /** Ветви типов внутри категории в порядке вывода. */
  children: Array<ItemGroupBranch>;
}

/** Узел дерева до разбора: что группируем и как подписываем. */
interface ItemGroupNodeSource {
  /**
   * Ключ узла: путь от корня, чтобы одинаковые типы в разных ветвях (например,
   * «Рукопашное оружие» у простого и воинского) не слились в одну группу.
   */
  key: string;

  /** Подпись разделителя узла. */
  label: string;

  /** Ветви типов, на которые делится узел. */
  branches: Array<ItemGroupBranch>;

  /** Предметы, отнесённые к узлу. */
  items: Array<ItemLinkResponse>;

  /** Подписи типов предметов из словаря фильтров раздела. */
  typeLabels: Map<string, string>;
}

/**
 * Собирает узел дерева групп и его подгруппы.
 *
 * Предмет попадает в первую ветвь, тип которой у него есть; предмет, не
 * подошедший ни одной ветви, остаётся в самом узле — так снаряжение с одним
 * лишь корневым типом (например, просто «Оружие») не теряется.
 *
 * @param source узел до разбора: ключ, подпись, ветви, предметы и подписи типов.
 * @returns узел дерева либо `undefined`, если ни в узле, ни в его подгруппах
 *   нет предметов.
 */
function buildGroupNode(
  source: ItemGroupNodeSource,
): GroupNode<ItemLinkResponse> | undefined {
  const { key, label, branches, items, typeLabels } = source;

  const ownItems: Array<ItemLinkResponse> = [];
  const itemsByType = new Map<string, Array<ItemLinkResponse>>();

  items.forEach((item) => {
    const branch = branches.find((candidate) =>
      item.types?.includes(candidate.type),
    );

    if (!branch) {
      ownItems.push(item);

      return;
    }

    itemsByType.set(branch.type, [
      ...(itemsByType.get(branch.type) ?? []),
      item,
    ]);
  });

  const children = branches.flatMap((branch) => {
    const branchLabel = branch.label ?? typeLabels.get(branch.type);

    // Тип, которого нет в словаре фильтров, не создаёт группу без подписи:
    // его предметы остаются в родительском узле.
    if (!branchLabel) {
      ownItems.push(...(itemsByType.get(branch.type) ?? []));

      return [];
    }

    const child = buildGroupNode({
      key: `${key}/${branch.type}`,
      label: branchLabel,
      branches: branch.children,
      items: itemsByType.get(branch.type) ?? [],
      typeLabels,
    });

    return child ? [child] : [];
  });

  if (!ownItems.length && !children.length) {
    return undefined;
  }

  return { key, label, items: ownItems, children };
}

/**
 * Строит иерархию групп раздела снаряжения: корень — категория предмета,
 * вложенные уровни — его типы (например, «Оружие» → «Воинское оружие» →
 * «Рукопашное оружие»). Пустые группы в дерево не попадают.
 *
 * @param items предметы раздела в порядке, полученном от API.
 * @param typeLabels подписи типов предметов из словаря фильтров раздела.
 * @returns корневые узлы дерева групп.
 */
export function buildItemGroupTree(
  items: Array<ItemLinkResponse>,
  typeLabels: Map<string, string>,
): Array<GroupNode<ItemLinkResponse>> {
  // Категория предмета — строка из ответа API, поэтому сравниваем по строкам:
  // неизвестное значение уходит в «Прочее», а не подставляется в дерево.
  const knownCategories = new Set<string>(
    ITEM_GROUP_ROOTS.map((root) => root.category),
  );

  const roots = ITEM_GROUP_ROOTS.flatMap((root) => {
    const node = buildGroupNode({
      key: root.category,
      label: root.label,
      branches: root.children,
      items: items.filter((item) => item.category === root.category),
      typeLabels,
    });

    return node ? [node] : [];
  });

  const otherItems = items.filter(
    (item) => !item.category || !knownCategories.has(item.category),
  );

  if (!otherItems.length) {
    return roots;
  }

  return [
    ...roots,
    {
      key: ITEM_OTHER_GROUP_KEY,
      label: ITEM_OTHER_GROUP_LABEL,
      items: otherItems,
      children: [],
    },
  ];
}
