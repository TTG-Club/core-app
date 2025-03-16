<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { GroupTag } from '~ui/source-tag';
  import { useDrawer } from '~/shared/composables';

  const { inLineagesDrawer } = defineProps<{
    species: SpeciesLinkResponse;
    inLineagesDrawer?: boolean;
  }>();

  const { open: openLineages } = useDrawer('species-lineages');

  const { open: openPreview } = useDrawer(
    inLineagesDrawer ? 'species-lineage-detail' : 'species-detail',
  );
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
        <button
          :class="$style.btn"
          @click.left.exact.prevent.stop="openPreview(species.url)"
        >
          Предпросмотр
        </button>

        <button
          v-if="species.hasLineages"
          :class="$style.btn"
          @click.left.exact.prevent.stop="openLineages(species.url)"
        >
          Разновидности
        </button>
      </div>
    </div>
  </NuxtLink>
</template>

<style module lang="scss">
  .link {
    will-change: box-shadow;

    overflow: hidden;

    border-radius: 16px;

    color: var(--color-text);

    background-color: var(--color-bg-secondary);

    & {
      @include css-anim($time: 0.23s);
    }

    &:not(:has(.actions:hover)) {
      &:hover {
        //box-shadow: 0 4px 8px 0 var(--color-shadow);
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
    gap: 8px;
    padding: 16px;

    .main {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .common {
      color: var(--color-text-gray);
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
    border-top: 1px solid var(--color-border);

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
        border-left: 1px solid var(--color-border);
      }

      &:hover {
        background-color: var(--color-hover);
      }
    }
  }
</style>
