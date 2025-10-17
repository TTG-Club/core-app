<script setup lang="ts">
  import { LinkLineages, LinkPreview } from './ui';
  import { SourceTag } from '~ui/source-tag';

  import type { SpeciesLinkResponse } from '~/shared/types';

  const { species } = defineProps<{
    species: SpeciesLinkResponse;
  }>();

  const { isDesktop } = useDevice();
</script>

<template>
  <NuxtLink :to="`/species/${species.url}`">
    <div
      :class="[
        'group relative overflow-hidden @max-md:flex',
        'rounded-2xl border border-default',
        'bg-muted text-default',
        'transition-all duration-[230ms] will-change-[box-shadow]',
        'hover:bg-[var(--color-hover)]',
        '[&:has(.actions:hover)]:hover:bg-muted',
      ]"
    >
      <!-- Image Block -->
      <div
        :class="[
          'relative overflow-hidden',
          'flex flex-none items-center justify-center',
          'aspect-square w-full',
          '@max-md:size-25',
        ]"
      >
        <img
          :src="species.image"
          :alt="species.name.rus"
          :class="['absolute h-full w-full', 'object-cover opacity-90']"
        />
      </div>

      <!-- Content Block -->
      <div
        :class="[
          'flex flex-auto flex-col',
          '@max-md:max-w-[calc(100cqw-calc(var(--spacing)*25))]',
        ]"
      >
        <!-- Info -->
        <div
          :class="[
            'flex flex-auto flex-col justify-center gap-0.5',
            'px-4 py-3 @max-md:px-3 @max-md:py-2',
          ]"
        >
          <!-- Main row -->
          <div class="flex items-center gap-0.5">
            <span
              :class="[
                'inline-block flex-1 overflow-hidden',
                'text-ellipsis whitespace-nowrap',
                'font-semibold text-highlighted',
              ]"
              :title="species.name.rus"
            >
              {{ species.name.rus }}
            </span>

            <SourceTag
              v-if="species.source?.name?.label"
              :source="species.source"
            />
          </div>

          <!-- English name row -->
          <div class="flex">
            <span
              :class="[
                'inline-block max-w-full overflow-hidden',
                'text-ellipsis whitespace-nowrap',
              ]"
              :title="species.name.eng"
            >
              {{ species.name.eng }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        v-if="isDesktop"
        :class="[
          'hidden gap-1 rounded-xl border border-default p-1',
          'group-hover:flex',
          'bg-default/50 shadow-md backdrop-blur-lg',
          'absolute top-2 right-2',
        ]"
      >
        <LinkPreview :url="species.url" />

        <LinkLineages
          v-if="species.hasLineages"
          :url="species.url"
        />
      </div>
    </div>
  </NuxtLink>
</template>
