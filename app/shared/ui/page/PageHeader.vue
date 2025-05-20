<script setup lang="ts">
  import { SourceTag } from '../source-tag';

  import { useCopy, useDayjs } from '~/shared/composables';

  import type { Dayjs } from 'dayjs';
  import type { SourceResponse } from '~/shared/types';

  export interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    dateTime?: string | number | Date | Dayjs | null;
    dateTimeFormat?: string;
    source?: SourceResponse;
    copyTitle?: boolean;
  }

  const props = withDefaults(defineProps<PageHeaderProps>(), {
    title: '',
    subtitle: '',
    source: undefined,
    dateTime: undefined,
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
    copyTitle: false,
  });

  const dayjs = useDayjs();
  const { copy } = useCopy();
  const navbarHidden = useState('navbar-hidden');

  function handleCopy(text: string) {
    if (!props.copyTitle) {
      return;
    }

    copy(text);
  }

  const formattedDateTime = computed(() => {
    const dateTime = dayjs(props.dateTime);

    if (!props.dateTime || !dateTime.isValid()) {
      return undefined;
    }

    if (!props.dateTimeFormat) {
      return dateTime.local().format('DD.MM.YYYY HH:mm');
    }

    return dateTime.local().format(props.dateTimeFormat);
  });

  function preventSelect(e: Event) {
    if (!props.copyTitle) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  }
</script>

<template>
  <div :class="$style.header">
    <div :class="$style.row">
      <h2
        v-if="title"
        :class="[$style.title, { [$style.copy]: copyTitle }]"
        @click.left.exact.prevent="handleCopy(title)"
        @selectstart="preventSelect"
        @select="preventSelect"
      >
        {{ title }}
      </h2>

      <ASkeleton
        v-else
        :paragraph="{ rows: 1 }"
        :title="false"
        data-allow-mismatch
      />

      <ClientOnly>
        <AFlex
          v-if="$slots.actions"
          :class="[
            $style.actions,
            $style.fixed,
            { [$style.withoutNavbar]: navbarHidden },
          ]"
          :gap="4"
        >
          <slot name="actions" />
        </AFlex>
      </ClientOnly>
    </div>

    <div
      v-if="subtitle || source || formattedDateTime"
      :class="$style.row"
    >
      <span
        v-if="subtitle"
        :class="[$style.subtitle, { [$style.copy]: copyTitle }]"
        @click.left.exact.prevent="handleCopy(subtitle)"
      >
        {{ subtitle }}
      </span>

      <AFlex
        v-if="source || formattedDateTime"
        :class="[$style.info, $style.fixed]"
        :gap="4"
      >
        <template v-if="formattedDateTime">
          <span :class="$style.time">
            {{ formattedDateTime }}
          </span>
        </template>

        <template v-if="source">
          <SourceTag
            :source="source"
            placement="bottomRight"
          />
        </template>
      </AFlex>
    </div>
  </div>
</template>

<style module lang="scss">
  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 16px;

    @include media-min($lg) {
      gap: 12px;
      padding-top: 32px;
    }
  }

  .row {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .title {
    overflow: hidden;
    display: inline-block;

    width: 100%;
    margin: 0;

    font-size: 24px;
    line-height: 32px;
    color: var(--color-text-title);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subtitle {
    overflow: hidden;
    display: inline-block;

    width: 100%;

    color: var(--color-text-gray);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title,
  .subtitle {
    &.copy {
      cursor: pointer;
    }
  }

  .actions {
    &.fixed {
      position: fixed;
      right: 8px;
      bottom: var(--navbar-height);

      display: flex;

      margin-bottom: 8px;
      padding: 4px;
      border: 1px solid var(--color-border);
      border-radius: 8px;

      background: var(--color-bg-main);

      transition: bottom ease-in-out 0.2s;

      &.withoutNavbar {
        bottom: 0;
        transition: bottom ease-in-out 0.2s;
      }

      @include media-min($md) {
        position: initial;
        //bottom: var(--navbar-height);
        //left: 8px;

        margin-bottom: initial;
        padding: initial;
        border: initial;
        border-radius: initial;

        background: initial;
      }
    }
  }

  .actions,
  .info {
    flex-shrink: 0;
    margin-left: auto;
  }

  .time {
    display: none;
    color: var(--color-text-gray);

    @include media-min($lg) {
      display: block;
    }
  }
</style>
