<script setup lang="ts">
  defineEmits<{
    (e: 'close'): void;
  }>();

  const route = useRoute();
  const clipboard = useClipboard();
  const { notification } = App.useApp();

  const isBookmarkDisabled = ref(true);

  const urlForCopy = computed(() => window.location.origin + route.path);

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
          description: 'Ссылка успешно скопирована',
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

  const openPrintWindow = () => {
    window.print();

    // sendShareMetrics({
    //   method: 'page_print',
    //   id: route.path,
    // });
  };
</script>

<template>
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
</template>
