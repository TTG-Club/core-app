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
      class="@max-[500px]:flex"
    >
      <div
        :class="$style.image"
        class="w-full @max-[500px]:max-h-[100px] @max-[500px]:max-w-[100px]"
      >
        <img
          :src="characterClass.image"
          :alt="characterClass.name.rus"
        />
      </div>

      <div class="w-full">
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
  }
</style>
