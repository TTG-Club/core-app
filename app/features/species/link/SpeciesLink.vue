<script setup lang="ts">
  import { LinkLineages, LinkPreview } from './ui';

  import { GroupTag } from '~ui/source-tag';

  import type { SpeciesLinkResponse } from '~/shared/types';

  const { species } = defineProps<{
    species: SpeciesLinkResponse;
  }>();
</script>

<template>
  <NuxtLink :to="`/species/${species.url}`">
    <div :class="$style.link">
      <div :class="$style.image">
        <img
          :src="species.image"
          :alt="species.name.rus"
        />
      </div>

      <div :class="$style.info">
        <div :class="$style.main">
          <span
            :class="[$style.name, $style.rus]"
            :title="species.name.rus"
          >
            {{ species.name.rus }}
          </span>

          <GroupTag :group="species.source.group" />
        </div>

        <div :class="$style.common">
          <span
            :class="[$style.name, $style.eng]"
            :title="species.name.eng"
          >
            {{ species.name.eng }}
          </span>
        </div>
      </div>

      <div :class="$style.actions">
        <LinkPreview :url="species.url" />

        <LinkLineages
          v-if="species.hasLineages"
          :url="species.url"
        />
      </div>
    </div>
  </NuxtLink>
</template>

<style module lang="scss">
  .link {
    will-change: box-shadow;

    overflow: hidden;

    border: 1px solid var(--ui-border);
    border-radius: 16px;

    color: var(--ui-text);

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

      display: block;

      width: 100%;
      padding-bottom: 100%;
    }

    img {
      position: absolute;

      width: 100%;
      height: 100%;

      opacity: 0.9;
      object-fit: cover;
    }
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 16px 4px;

    .main {
      display: flex;
      gap: 2px;
      align-items: center;
    }

    .common {
      color: var(--ui-text-highlighted);
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
    }

    &.eng {
      max-width: 100%;
    }
  }

  .actions {
    display: flex;
    border-top: 1px solid var(--ui-border);

    .btn {
      cursor: pointer;

      flex: 1 1 auto;

      padding: 12px 0;
      border: none;

      background-color: transparent;

      & {
        @include css-anim();
      }

      &:not(:first-child) {
        border-left: 1px solid var(--ui-border);
      }

      &:hover {
        background-color: var(--color-hover);
      }
    }
  }
</style>
