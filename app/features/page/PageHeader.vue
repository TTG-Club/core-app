<script setup lang="ts">
  import type { Dayjs } from 'dayjs';
  import type { Source } from '~/shared/types';

  export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    dateTime?: string | number | Date | Dayjs | null;
    dateTimeFormat?: string;
    source?: Source;
  }

  const props = withDefaults(defineProps<PageHeaderProps>(), {
    subtitle: '',
    source: undefined,
    dateTime: undefined,
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
  });

  const dayjs = useDayjs();
  const clipboard = useClipboard();

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

  const copyText = (text?: string) => {
    if (!text) {
      return;
    }

    if (!clipboard.isSupported) {
      notification.error({
        message: 'Ошибка при копировании',
        description: 'Ваш браузер не поддерживает копирование',
      });
    }

    clipboard
      .copy(text)
      .then(() => {
        notification.success({
          message: 'Копирование',
          description: 'Текст успешно скопирован',
        });
      })
      .catch(() => {
        notification.error({
          message: 'Ошибка при копировании',
          description: () =>
            h('span', [
              'Произошла какая-то ошибка... попробуйте еще раз или обратитесь за помощью на нашем ',
              h(
                'a',
                {
                  target: '_blank',
                  href: 'https://discord.gg/JqFKMKRtxv',
                  rel: 'noopener',
                },
                'Discord-канале',
              ),
            ]),
        });
      });
  };
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
        :gap="4"
        vertical
      >
        <ATypographyTitle
          data-allow-mismatch
          :level="2"
          :content="title"
          :style="{ cursor: 'pointer' }"
          ellipsis
          @click.left.exact.prevent="copyText(title)"
        />

        <ATypographyText
          v-if="subtitle"
          data-allow-mismatch
          :content="subtitle"
          type="secondary"
          :style="{ cursor: 'pointer' }"
          ellipsis
          @click.left.exact.prevent="copyText(subtitle)"
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

          <ATooltip
            v-if="source"
            :title="`${source.name.rus} [${source.name.eng}]`"
            placement="topRight"
            arrow-point-at-center
          >
            <ATag
              :color="`var(--color-badge-${source.group.short.toLowerCase()})`"
              :style="{ marginInlineEnd: 0 }"
            >
              {{ source.name.short }}
            </ATag>
          </ATooltip>
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
