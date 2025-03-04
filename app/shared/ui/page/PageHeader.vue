<script setup lang="ts">
  import type { Dayjs } from 'dayjs';
  import type { SourceResponse } from '~/shared/types';
  import { useCopy } from '~/shared/composables';

  export interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    dateTime?: string | number | Date | Dayjs | null;
    dateTimeFormat?: string;
    source?: SourceResponse;
  }

  const props = withDefaults(defineProps<PageHeaderProps>(), {
    title: '',
    subtitle: '',
    source: undefined,
    dateTime: undefined,
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
  });

  const dayjs = useDayjs();
  const { copy } = useCopy();

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
          :style="{ cursor: 'pointer', lineHeight: '32px' }"
          :content="title"
          :level="2"
          data-allow-mismatch
          ellipsis
          @click.left.exact.prevent="copy(title)"
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
          :style="{ cursor: 'pointer' }"
          ellipsis
          @click.left.exact.prevent="copy(subtitle)"
        />
      </AFlex>

      <AFlex
        v-if="$slots.actions || source || formattedDateTime"
        :gap="4"
        align="flex-end"
        vertical
      >
        <AFlex
          v-if="$slots.actions"
          :gap="4"
        >
          <slot name="actions" />
        </AFlex>

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
            <ATooltip
              :title="source.group.rus"
              placement="bottomRight"
              arrow-point-at-center
            >
              <ATag :style="{ marginInlineEnd: 0 }">
                {{ source.group.label }}
              </ATag>
            </ATooltip>

            <ATooltip
              :title="`${source.name.rus} [${source.name.eng}]`"
              placement="bottomRight"
              arrow-point-at-center
            >
              <ATag
                :color="`var(--color-badge-${source.group.label.toLowerCase()})`"
                :style="{ marginInlineEnd: 0 }"
              >
                {{ source.name.label }}
              </ATag>
            </ATooltip>
          </template>
        </AFlex>
      </AFlex>
    </AFlex>

    <AFlex
      v-if="$slots.filter"
      :gap="8"
    >
      <slot name="filter" />
    </AFlex>
  </AFlex>
</template>
