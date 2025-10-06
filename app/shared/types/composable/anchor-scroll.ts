export interface AnchorScrollOptions {
  behavior?: ScrollBehavior;
  offsetTop?: number;
  offsetLeft?: number;
}

export interface AnchorScrollComposable {
  scrollToAnchor: (
    target: MaybeRefOrGetter<HTMLElement | string>,
    options?: AnchorScrollOptions,
  ) => boolean;
  scrollToTop: (options?: AnchorScrollOptions) => void;
}

export interface AnchorScrollPageMetaCustomOptions {
  toAnchor?: AnchorScrollOptions;
  toTop?: AnchorScrollOptions;
  disabled?: AnchorScrollPageMetaDisabledOptions | true;
}

export interface AnchorScrollPageMetaDisabledOptions {
  toAnchor?: true;
  toTop?: true;
}

export interface AnchorScrollConfiguration {
  toAnchor?: MaybeRefOrGetter<Partial<AnchorScrollOptions>>;
  toTop?: MaybeRefOrGetter<Partial<AnchorScrollOptions>>;
}
