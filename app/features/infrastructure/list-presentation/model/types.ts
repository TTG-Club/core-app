export type ListPresentationGroupKey = string | number;

export type ListPresentationSeparatorLabel =
  | string
  | ((value: ListPresentationGroupKey) => string);

export interface ListPresentationGroup<TItem> {
  key: ListPresentationGroupKey;
  items: Array<TItem>;
}

export type ListPresentationGroupSort<TItem> =
  | { mode: 'auto' }
  | {
      mode: 'ordered';
      order: Set<ListPresentationGroupKey>;
      unknown?: 'after' | 'before' | 'auto';
    }
  | {
      mode: 'comparator';
      compare: (
        firstKey: ListPresentationGroupKey,
        secondKey: ListPresentationGroupKey,
      ) => number;
    }
  | {
      mode: 'custom';
      compare: (items: Array<TItem>) => Array<ListPresentationGroup<TItem>>;
    };

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
