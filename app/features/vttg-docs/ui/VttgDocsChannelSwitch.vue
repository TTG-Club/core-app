<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import type { VttgDocsChannel } from '#shared/consts';

  import { getVttgDocsIndexRoute } from '#shared/utils';

  import {
    VTTG_DOCS_CHANNEL_ICONS,
    VTTG_DOCS_CHANNEL_LABELS,
    VTTG_DOCS_CHANNEL_SWITCH_MIN_COUNT,
  } from '../model';

  /**
   * Переключатель канала. Показывается только тем, кому открыт не один канал.
   * Ведёт на оглавление: страницы в каналах могут не совпадать.
   */
  const { channels, channel } = defineProps<{
    channels: VttgDocsChannel[];
    channel: VttgDocsChannel;
  }>();

  /**
   * Вид кнопки: текущий канал выделен.
   *
   * @param buttonChannel канал кнопки
   */
  function getVariant(buttonChannel: VttgDocsChannel): ButtonProps['variant'] {
    return buttonChannel === channel ? 'solid' : 'subtle';
  }

  const channelButtons = computed(() =>
    channels.map((buttonChannel) => ({
      channel: buttonChannel,
      label: VTTG_DOCS_CHANNEL_LABELS[buttonChannel],
      icon: VTTG_DOCS_CHANNEL_ICONS[buttonChannel],
      to: getVttgDocsIndexRoute(buttonChannel),
      variant: getVariant(buttonChannel),
    })),
  );

  const isSwitchShown = computed(
    () => channels.length >= VTTG_DOCS_CHANNEL_SWITCH_MIN_COUNT,
  );
</script>

<template>
  <UFieldGroup
    v-if="isSwitchShown"
    size="sm"
  >
    <UButton
      v-for="button in channelButtons"
      :key="button.channel"
      color="neutral"
      :variant="button.variant"
      :icon="button.icon"
      :label="button.label"
      :to="button.to"
    />
  </UFieldGroup>
</template>
