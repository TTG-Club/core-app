<script setup lang="ts">
  import { orderBy } from 'lodash-es';

  import type { ToastPosition, ToastProps } from '../types';
  import { useToastState } from '../state';
  import ToastGroup from './ToastGroup.vue';

  const { maxToasts = 6 } = defineProps<{
    maxToasts?: number;
  }>();

  const verticalGroups: Array<'bottom' | 'top'> = ['bottom', 'top'];
  const horizontalGroups: Array<'left' | 'right'> = ['left', 'right'];

  const { toasts } = useToastState();

  const getToastsByPosition = (position: ToastPosition) => {
    const positionFilter = (toast: ToastProps) => {
      if (position === 'top-right') {
        return toast.position === 'top-right' || !toast.position;
      }

      return toast.position === position;
    };

    const filtered = toasts.value.filter(positionFilter);
    const sorted = orderBy(filtered, (toast) => toast.id);

    return sorted.slice(0, maxToasts);
  };

  const getGroupProps = (
    vertical: 'top' | 'bottom',
    horizontal: 'left' | 'right',
  ) => ({
    vertical,
    horizontal,
    toasts: getToastsByPosition(`${vertical}-${horizontal}`),
  });
</script>

<template>
  <div :class="$style.toasts">
    <template
      v-for="verticalGroup in verticalGroups"
      :key="verticalGroup"
    >
      <ToastGroup
        v-for="horizontalGroup in horizontalGroups"
        v-bind="getGroupProps(verticalGroup, horizontalGroup)"
        :key="horizontalGroup"
      />
    </template>
  </div>
</template>

<style module lang="scss">
  .toasts {
    pointer-events: none;

    position: fixed;
    z-index: 2000;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
  }
</style>
