<script setup lang="ts">
  import { LinkPreview, LinkSubclasses } from './ui';
  import { SourceTag } from '~ui/source-tag';

  import type { ClassLinkResponse } from '~classes/types';

  const { characterClass } = defineProps<{
    characterClass: ClassLinkResponse;
  }>();
</script>

<template>
  <NuxtLink :to="`/classes/${characterClass.url}`">
    <div
      :class="$style.link"
      class="radius-x flex overflow-hidden rounded-xl"
    >
      <div
        :class="$style.image"
        class="relative hidden min-w-[160px] items-center justify-center overflow-hidden sm:flex"
      >
        <img
          :src="characterClass.image"
          :alt="characterClass.name.rus"
        />
      </div>

      <div class="flex w-full flex-col">
        <div :class="$style.info">
          <div :class="$style.main">
            <span
              :class="[$style.name, $style.rus]"
              :title="characterClass.name.rus"
            >
              {{ characterClass.name.rus }}
            </span>

            <SourceTag
              v-if="characterClass.source?.name?.label"
              :source="characterClass.source"
            />
          </div>

          <div :class="$style.common">
            <span
              :class="[$style.name, $style.eng]"
              :title="characterClass.name.eng"
            >
              {{ characterClass.name.eng }}
            </span>
          </div>
        </div>

        <div :class="$style.actions">
          <LinkPreview :url="characterClass.url" />

          <LinkSubclasses
            v-if="characterClass.hasSubclasses"
            :url="characterClass.url"
          />
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style module lang="scss">
  .link {
    will-change: box-shadow;
    border: 1px solid var(--ui-border);
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

  .actions {
    display: flex;
    border-top: 1px solid var(--ui-border);

    button {
      display: flex;
      padding: 8px 16px;
    }
  }
</style>
