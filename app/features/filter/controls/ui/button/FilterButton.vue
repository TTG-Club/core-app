<script setup lang="ts">
  import { SvgIcon } from '~ui/icon';

  const {
    pending,
    edited,
    disabled,
    fullWidth = false,
  } = defineProps<{
    pending: boolean;
    edited: boolean;
    disabled: boolean;
    fullWidth?: boolean;
  }>();

  defineEmits<{
    (e: 'open'): void;
  }>();
</script>

<template>
  <ClientOnly>
    <ABadge
      :offset="[-1, 1]"
      :class="[$style.badge, { [$style.fullWidth]: fullWidth }]"
      :dot="edited"
      title="Количество примененных фильтров"
    >
      <AButton
        :class="[$style.button, { [$style.fullWidth]: fullWidth }]"
        :loading="pending"
        :disabled="disabled"
        :block="fullWidth"
        type="primary"
        @click.left.exact.prevent="$emit('open')"
      >
        <span>Фильтр</span>

        <template #icon>
          <SvgIcon icon="filter/outline" />
        </template>
      </AButton>
    </ABadge>
  </ClientOnly>
</template>

<style module lang="scss">
  .badge {
    :global {
      .ant-badge-dot {
        width: 12px;
        height: 12px;
        border: 2px solid var(--color-bg-main);
        box-shadow: none;
      }
    }
  }

  .badge,
  .button {
    &.fullWidth {
      width: 100%;
    }
  }
</style>
