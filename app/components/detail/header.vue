<script setup lang="ts">
  import type { Dayjs } from 'dayjs';
  import type { Source } from '#shared/types/base';

  defineEmits<{
    (e: 'close'): void;
  }>();

  const props = withDefaults(
    defineProps<{
      title: string;
      subtitle?: string;
      dateTime?: string | number | Date | Dayjs | null;
      dateTimeFormat?: string;
      source?: Source;
    }>(),
    {
      subtitle: '',
      source: undefined,
      dateTime: undefined,
      dateTimeFormat: 'DD.MM.YYYY HH:mm',
    },
  );

  const dayjs = useDayjs();
  const route = useRoute();
  const clipboard = useClipboard();
  const { notification } = App.useApp();

  const isBookmarkDisabled = ref(true);

  const urlForCopy = computed(() => window.location.origin + route.path);

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

  function copyURL() {
    if (!clipboard.isSupported) {
      notification.error({
        message: 'Ошибка при копировании',
        description: 'Ваш браузер не поддерживает копирование',
      });
    }

    clipboard
      .copy(urlForCopy.value)
      .then(() => {
        notification.success({
          message: 'Копирование',
          description: `Ссылка на ${props.title} успешно скопирована`,
        });

        // sendShareMetrics({
        //   method: 'link_copy',
        //   id: route.path,
        // });
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
  }

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

  const openPrintWindow = () => {
    window.print();

    // sendShareMetrics({
    //   method: 'page_print',
    //   id: route.path,
    // });
  };
</script>

<template>
  <AFlex
    justify="space-between"
    :class="$style.header"
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
        :class="$style.description"
        :style="{ cursor: 'pointer' }"
        ellipsis
        @click.left.exact.prevent="copyText(subtitle)"
      />
    </AFlex>

    <AFlex
      :gap="4"
      align="flex-end"
      vertical
    >
      <AFlex :gap="4">
        <ATooltip title="Скопировать ссылку">
          <AButton
            type="text"
            @click.left.exact.prevent="copyURL"
          >
            <template #icon>
              <SvgIcon icon="copy" />
            </template>
          </AButton>
        </ATooltip>

        <ATooltip :title="!isBookmarkDisabled ? 'Закладка' : ''">
          <AButton
            :disabled="isBookmarkDisabled"
            type="text"
          >
            <template #icon>
              <SvgIcon icon="bookmark/outline" />
            </template>
          </AButton>
        </ATooltip>

        <ATooltip title="Открыть окно печати">
          <AButton
            type="text"
            @click.left.exact.prevent="openPrintWindow"
          >
            <template #icon>
              <SvgIcon icon="print" />
            </template>
          </AButton>
        </ATooltip>

        <ATooltip title="Закрыть">
          <AButton
            type="text"
            @click.left.exact.prevent="$emit('close')"
          >
            <template #icon>
              <SvgIcon icon="close" />
            </template>
          </AButton>
        </ATooltip>
      </AFlex>

      <AFlex :gap="8">
        <ATypographyText
          v-if="formattedDateTime"
          data-allow-mismatch
          :class="$style.description"
          :content="formattedDateTime"
          ellipsis
        />

        <ATooltip
          v-if="source"
          :title="source.name.rus"
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
</template>

<style module lang="scss">
  .header {
    padding-top: 32px;
  }

  .description {
    color: var(--color-text-g);
  }
</style>
