<script setup lang="ts">
  import { SourceTag } from '~ui/source-tag';
  import type { NameResponse, SourceResponse } from '~/shared/types';
  import type { RouteLocationRaw } from 'vue-router';

  const {
    to,
    name,
    image = undefined,
    source = undefined,
    hasActions = false,
    hideGalleryOnMobile = false,
    showHeaderSourceOnMobile = false,
  } = defineProps<{
    to: RouteLocationRaw;
    name: NameResponse;
    source?: SourceResponse;
    image?: string;
    hasActions?: boolean;
    hideGalleryOnMobile?: boolean;
    showHeaderSourceOnMobile?: boolean;
  }>();

  const slots = useSlots();
  const { isDesktop, isMobile } = useDevice();

  const img = computed(() => image || '/img/no-img.webp');

  const showActions = computed(
    () => slots.actions && (isDesktop || hasActions),
  );

  const shouldHideGallery = computed(() => {
    // Если включено скрытие на мобильных и мы на мобильном устройстве
    if (hideGalleryOnMobile && isMobile) return true;

    return false;
  });
</script>

<template>
  <NuxtLink
    :to="to"
    :class="[
      'group overflow-hidden @max-md:flex',
      'rounded-xl border border-default',
      'bg-muted text-default',
    ]"
  >
    <!-- Image Block -->
    <div
      v-if="!shouldHideGallery"
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
          'bg-gradient-to-t from-muted to-transparent to-50%',
          'transition-all duration-300 @md:group-hover:top-full',
          '@max-md:bg-gradient-to-l',
        ]"
      />

      <SourceTag
        v-if="source?.name?.label"
        :source="source"
        class="absolute top-2 right-2"
      />
    </div>

    <!-- Content Block -->
    <div
      :class="[
        'flex flex-auto justify-between gap-2 px-4 py-3',
        '@max-md:gap-1 @max-md:px-3 @max-md:py-2',
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
            v-if="source?.name?.label && isMobile && showHeaderSourceOnMobile"
            :source="source"
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
        v-if="showActions"
        :class="[
          'flex flex-none items-center justify-end gap-2',
          'group-hover:flex @md:hidden',
        ]"
      >
        <slot name="actions" />
      </div>
    </div>
  </NuxtLink>
</template>
