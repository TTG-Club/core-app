<script setup lang="ts">
  import { CopyButton } from '../../copy-button';
  import { SvgIcon } from '../../icon';

  import { useUserStore } from '~/shared/stores';

  defineEmits<{
    (e: 'close'): void;
  }>();

  defineProps<{
    url?: string;
    editUrl?: string;
  }>();

  const { isAdmin } = storeToRefs(useUserStore());
</script>

<template>
  <AFlex
    :gap="8"
    justify="flex-end"
  >
    <ATooltip
      v-if="editUrl && isAdmin"
      title="Редактировать"
      :mouse-enter-delay="0.7"
      destroy-tooltip-on-hide
    >
      <AButton
        :href="editUrl"
        size="small"
        type="text"
        @click.left.exact.prevent="
          navigateTo(editUrl, {
            open: {
              target: '_blank',
              windowFeatures: {
                noreferrer: true,
                noopener: true,
              },
            },
          })
        "
      >
        <template #icon>
          <SvgIcon icon="edit" />
        </template>
      </AButton>
    </ATooltip>

    <AButton
      v-if="url"
      :href="url"
      size="small"
      type="text"
      @click.left.exact.prevent="
        navigateTo(url, {
          open: {
            target: '_blank',
            windowFeatures: {
              noreferrer: true,
              noopener: true,
            },
          },
        })
      "
    >
      <template #icon>
        <SvgIcon icon="new-page" />
      </template>
    </AButton>

    <CopyButton
      v-if="url"
      :url
      size="small"
    />

    <ATooltip
      v-if="url"
      title="Закладка"
      :mouse-enter-delay="0.7"
      destroy-tooltip-on-hide
    >
      <AButton
        size="small"
        type="text"
        disabled
      >
        <template #icon>
          <SvgIcon icon="bookmark/outline" />
        </template>
      </AButton>
    </ATooltip>

    <AButton
      size="small"
      type="text"
      @click.left.exact.prevent="$emit('close')"
    >
      <template #icon>
        <SvgIcon icon="x" />
      </template>
    </AButton>
  </AFlex>
</template>
