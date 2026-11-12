<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import type { NameResponse, SourceResponse } from '~/shared/types';

  import { SourceTag } from '~ui/source-tag';

  import {
    CARD_LINK_CONTENT_WIDTH_CLASSES,
    CARD_LINK_LAYOUT_CLASSES,
  } from './constants';

  const {
    to,
    name,
    image = undefined,
    source = undefined,
    hasActions = false,
    hideImageOnMobile = false,
    isOpened = false,
    row = false,
  } = defineProps<{
    to: RouteLocationRaw;
    name: NameResponse;
    source?: SourceResponse;
    image?: string;
    hasActions?: boolean;
    hideImageOnMobile?: boolean;
    isOpened?: boolean;
    /**
     * Строкой: обложка маленьким квадратом слева, как на узком экране. Для
     * вида списков «строками» из шестерёнки.
     */
    row?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'open-drawer' | 'navigate'): void;
  }>();

  const slots = useSlots();
  const { isDesktop, isMobile } = useDevice();

  const img = computed(() => image || '/img/no-img.webp');

  const isActionsShowed = computed(
    () => slots.actions && (isDesktop || hasActions),
  );

  const isImageHidden = computed(() => hideImageOnMobile && isMobile);

  // На маленькой обложке строки значок источника не помещается — он у названия
  const isSourceInline = computed(() => row || isImageHidden.value);

  const contentWidthClass = computed(() => {
    if (row) {
      return undefined;
    }

    return isImageHidden.value
      ? CARD_LINK_CONTENT_WIDTH_CLASSES.full
      : CARD_LINK_CONTENT_WIDTH_CLASSES.besideImage;
  });

  const { isSplitActive } = useLayoutWidth();

  // Строкой карточка всегда выглядит так, как на узком контейнере
  const layoutClasses = computed(() =>
    row ? CARD_LINK_LAYOUT_CLASSES.row : CARD_LINK_LAYOUT_CLASSES.card,
  );

  /**
   * Обработчик клика по карточке.
   * В широком режиме (split) на десктопе — открывает детальную панель.
   * В обычном режиме — выполняет переход по ссылке на полную страницу.
   */
  function handleClick() {
    if (isDesktop && isSplitActive.value) {
      return emit('open-drawer');
    }

    navigateTo(to);

    return emit('navigate');
  }
</script>

<template>
  <NuxtLink
    v-slot="{ href }"
    v-memo="[to, isOpened, row]"
    custom
    :to="to"
  >
    <a
      :href="href ?? undefined"
      :class="[
        'group overflow-hidden transition-[color,background-color,border-color,box-shadow]',
        layoutClasses.link,
        'rounded-xl border',
        isOpened
          ? 'border-primary bg-primary/10 text-highlighted shadow-sm ring-1 ring-primary/50'
          : 'border-default bg-muted text-default hover:border-accented',
      ]"
      @click.exact.prevent.stop="handleClick"
    >
      <!-- Image Block -->
      <div
        v-if="!isImageHidden"
        :class="[
          'relative overflow-hidden',
          'flex flex-none items-center justify-center',
          layoutClasses.image,
        ]"
      >
        <img
          decoding="async"
          :src="img"
          :alt="name.rus"
          :class="['absolute h-full w-full', 'object-cover opacity-90']"
        />

        <!-- Градиент уезжает при наведении сдвигом, а не сменой размеров:
          без пересчёта вёрстки -->
        <div
          :class="[
            'absolute inset-0',
            'bg-linear-to-t from-muted to-transparent to-50%',
            'transition-transform duration-300',
            layoutClasses.gradient,
          ]"
        />

        <SourceTag
          v-if="!isSourceInline"
          :source="source"
          class="absolute top-2 right-2"
          show-tooltip
        />
      </div>

      <!-- Content Block -->
      <div
        :class="[
          'flex flex-auto justify-between',
          layoutClasses.content,
          contentWidthClass,
        ]"
      >
        <!-- Info -->
        <div class="flex min-w-0 flex-auto flex-col justify-center gap-0.5">
          <!-- Main row -->
          <div class="flex justify-between gap-2">
            <span
              :class="[
                'inline-block overflow-hidden',
                layoutClasses.name,
                'text-ellipsis whitespace-nowrap',
                'font-semibold text-highlighted',
              ]"
              :title="name.rus"
            >
              {{ name.rus }}
            </span>

            <SourceTag
              v-if="isSourceInline"
              :source="source"
              show-tooltip
            />
          </div>

          <!-- English name row -->
          <span
            :class="[
              'inline-block max-w-full overflow-hidden',
              'text-ellipsis whitespace-nowrap',
            ]"
            :title="name.eng"
          >
            {{ name.eng }}
          </span>
        </div>

        <!-- Actions -->
        <div
          v-if="isActionsShowed"
          :class="[
            'flex flex-none items-center justify-end gap-2',
            'group-hover:flex @md:hidden',
          ]"
        >
          <slot name="actions" />
        </div>
      </div>
    </a>
  </NuxtLink>
</template>
