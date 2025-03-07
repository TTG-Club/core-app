<script setup lang="ts">
  import type { Dayjs } from 'dayjs';
  import type { SourceResponse } from '~/shared/types';
  import { useCopy } from '~/shared/composables';
  import { SourceTag } from '~/shared/ui';

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
</script>

<template>
  <AFlex
    :gap="16"
    vertical
  >
    <AFlex
      justify="space-between"
      :style="{ paddingTop: '32px' }"
    >
      <AFlex
        justify="center"
        flex="1"
        vertical
      >
        <ATypographyTitle
          v-if="title"
          :style="{
            cursor: copyTitle ? 'pointer' : 'default',
            lineHeight: '32px',
          }"
          :content="title"
          :level="2"
          data-allow-mismatch
          ellipsis
          @click.left.exact.prevent="handleCopy(title)"
        />

        <ASkeleton
          v-else
          :paragraph="{ rows: 1 }"
          :title="false"
          data-allow-mismatch
        />

        <ATypographyText
          v-if="subtitle"
          data-allow-mismatch
          :content="subtitle"
          type="secondary"
          :style="{ cursor: copyTitle ? 'pointer' : 'default' }"
          ellipsis
          @click.left.exact.prevent="handleCopy(subtitle)"
        />
      </AFlex>

      <AFlex
        v-if="$slots.actions || source || formattedDateTime"
        :gap="4"
        align="flex-end"
        vertical
      >
        <ClientOnly>
          <AFlex
            v-if="$slots.actions"
            :gap="4"
          >
            <slot name="actions" />
          </AFlex>
        </ClientOnly>

        <AFlex
          v-if="source || formattedDateTime"
          :gap="8"
        >
          <ATypographyText
            v-if="formattedDateTime"
            data-allow-mismatch
            :content="formattedDateTime"
            ellipsis
            type="secondary"
          />

          <template v-if="source">
            <SourceTag :source="source" />
          </template>
        </AFlex>
      </AFlex>
    </AFlex>

    <ClientOnly>
      <AFlex
        v-if="$slots.filter"
        :gap="8"
      >
        <slot name="filter" />
      </AFlex>
    </ClientOnly>
  </AFlex>
</template>
