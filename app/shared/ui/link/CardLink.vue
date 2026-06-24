<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import type { NameResponse, SourceResponse } from '~/shared/types';

  import { SourceTag } from '~ui/source-tag';

  const {
    to,
    name,
    image = undefined,
    source = undefined,
    hasActions = false,
    hideImageOnMobile = false,
    isOpened = false,
  } = defineProps<{
    to: RouteLocationRaw;
    name: NameResponse;
    source?: SourceResponse;
    image?: string;
    hasActions?: boolean;
    hideImageOnMobile?: boolean;
    isOpened?: boolean;
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

  const { isSplitActive } = useLayoutWidth();

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
    v-memo="[to, isOpened]"
    custom
    :to="to"
  >
    <a
      :href="href ?? undefined"
      :class="[
        'group overflow-hidden transition-all @max-md:flex',
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
          'aspect-square w-full',
          '@max-md:size-25',
        ]"
      >
        <img
          :src="img"
          :alt="name.rus"
          :class="['absolute h-full w-full', 'object-cover opacity-90']"
        />

        <!-- Gradient Overlay -->
        <div
          :class="[
            'absolute inset-0',
            'bg-linear-to-t from-muted to-transparent to-50%',
            'transition-all duration-300 @md:group-hover:top-full',
            '@max-md:bg-linear-to-l',
          ]"
        />

        <SourceTag
          :source="source"
          class="absolute top-2 right-2"
          show-tooltip
        />
      </div>

      <!-- Content Block -->
      <div
        :class="[
          'flex flex-auto justify-between gap-2 px-4 py-3',
          '@max-md:gap-1 @max-md:px-3 @max-md:py-2',
          !isImageHidden
            ? '@max-md:max-w-[calc(100cqw-calc(var(--spacing)*25))]'
            : '@max-md:max-w-full',
        ]"
      >
        <!-- Info -->
        <div class="flex min-w-0 flex-auto flex-col justify-center gap-0.5">
          <!-- Main row -->
          <div class="flex justify-between">
            <span
              :class="[
                'inline-block overflow-hidden @md:flex-1',
                'text-ellipsis whitespace-nowrap',
                'font-semibold text-highlighted',
              ]"
              :title="name.rus"
            >
              {{ name.rus }}
            </span>

            <SourceTag
              v-if="isImageHidden"
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
