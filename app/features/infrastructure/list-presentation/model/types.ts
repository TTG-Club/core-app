import type {
  Group,
  GroupKey,
  GroupSort,
  SeparatorLabel,
} from '~ui/grouped-list';

// Контракт группировки — общий с GroupedList, который его исполняет.
// Единый источник правды живёт в ~ui/grouped-list, здесь только доменные псевдонимы.
export type ListPresentationGroupKey = GroupKey;

export type ListPresentationSeparatorLabel = SeparatorLabel;

export type ListPresentationGroup<TItem> = Group<TItem>;

export type ListPresentationGroupSort<TItem> = GroupSort<TItem>;

export interface ListPresentationOption<TValue extends string> {
  label: string;
  value: TValue;
  apiValue: string;
}

export type ListPresentationItemSort<TItem> = (
  firstItem: TItem,
  secondItem: TItem,
) => number;

export interface ListPresentationSortingOption<
  TItem,
  TValue extends string,
> extends ListPresentationOption<TValue> {
  itemSort?: ListPresentationItemSort<TItem>;
  resolveItemSort?: () => ListPresentationItemSort<TItem>;
}

export interface ListPresentationGroupingOption<
  TItem,
  TValue extends string,
> extends ListPresentationOption<TValue> {
  field?: string;
  groupSort?:
    | ListPresentationGroupSort<TItem>
    | (() => ListPresentationGroupSort<TItem>);
  separatorLabel?: ListPresentationSeparatorLabel;
}

export interface ListPresentationConfig<
  TItem,
  TGrouping extends string,
  TSorting extends string,
> {
  sectionKey: string;
  defaultGrouping: TGrouping;
  defaultSorting: TSorting;
  groupingOptions: [
    ListPresentationGroupingOption<TItem, TGrouping>,
    ...Array<ListPresentationGroupingOption<TItem, TGrouping>>,
  ];
  sortingOptions: [
    ListPresentationSortingOption<TItem, TSorting>,
    ...Array<ListPresentationSortingOption<TItem, TSorting>>,
  ];
}
