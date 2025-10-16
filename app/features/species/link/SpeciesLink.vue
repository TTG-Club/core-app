<script setup lang="ts">
  import { LinkLineages, LinkPreview } from './ui';

  import { SourceTag } from '~ui/source-tag';

  import type { SpeciesLinkResponse } from '~/shared/types';

  const { species } = defineProps<{
    species: SpeciesLinkResponse;
  }>();
</script>

<template>
  <NuxtLink :to="`/species/${species.url}`">
    <div
      :class="$style.link"
      class="overflow-hidden rounded-xl border @max-[500px]:flex"
    >
      <div
        :class="$style.image"
        class="@max-[500px]:max-h-[103px] @max-[500px]:min-w-[100px]"
      >
        <img
          :src="species.image"
          :alt="species.name.rus"
        />

        <SourceTag
          v-if="species.source?.name?.label"
          :source="species.source"
          class="absolute top-2 right-2"
        />
      </div>

      <div class="w-full">
        <div class="flex px-4 py-2">
          <div class="flex w-full flex-col gap-1">
            <span
              :class="[$style.name, $style.rus]"
              :title="species.name.rus"
            >
              {{ species.name.rus }}
            </span>

            <span
              :class="[$style.name, $style.eng]"
              :title="species.name.eng"
            >
              {{ species.name.eng }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <LinkPreview :url="species.url" />

            <LinkLineages
              v-if="species.hasLineages"
              :url="species.url"
            />
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style module lang="scss">
  .link {
    will-change: box-shadow;
    border-color: var(--ui-border);
    background-color: var(--ui-bg-muted);

    & {
      @include css-anim($time: 0.23s);
    }

    &:not(:has(.actions:hover)) {
      &:hover {
        background-color: var(--color-hover);
      }
    }
  }

  .image {
    position: relative;

    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    height: 248px;

    &:before {
      pointer-events: none;
      content: '';

      position: relative;
      z-index: 1;
      bottom: 0;

      display: block;

      width: 100%;
      padding-bottom: 100%;

      background: linear-gradient(
        0deg,
        rgba(29, 32, 42, 1) 0%,
        rgba(255, 255, 255, 0) 50%
      );
    }

    img {
      position: absolute;

      width: 100%;
      height: 100%;

      opacity: 0.9;
      object-fit: cover;
    }
  }

  .name {
    overflow: hidden;
    display: inline-block;
    flex: 1;

    text-overflow: ellipsis;
    white-space: nowrap;

    &.rus {
      font-weight: 600;
      color: var(--ui-text-highlighted);
    }

    &.eng {
      max-width: 100%;
    }
  }
</style>
