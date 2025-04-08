<script setup lang="ts">
  import { orderBy } from 'lodash-es';

  import { useToastState } from '../state';

  import ToastGroup from './ToastGroup.vue';

  import { Breakpoint, useBreakpoints } from '~/shared/composables';

  import type { ToastPosition, ToastProps } from '../types';

  const { maxToasts = 6 } = defineProps<{
    maxToasts?: number;
  }>();

  const { toasts } = useToastState();
  const { smaller } = useBreakpoints();

  const verticalGroups: Array<'bottom' | 'top'> = ['bottom', 'top'];
  const horizontalGroups: Array<'left' | 'right'> = ['left', 'right'];

  const isOnlyTopRight = smaller(Breakpoint.LG);

  function getGroupProps(
    vertical: 'top' | 'bottom',
    horizontal: 'left' | 'right',
  ) {
    return {
      vertical,
      horizontal,
      toasts: getToastsByPosition(`${vertical}-${horizontal}`),
    };
  }

  function getToastsByPosition(position: ToastPosition) {
    const filtered = toasts.value.filter((toast) =>
      positionFilter(toast, position),
    );

    return getSortedSlice(filtered);
  }

  function positionFilter(toast: ToastProps, position: ToastPosition) {
    if (isOnlyTopRight.value) {
      return position === 'top-right';
    }

    if (position === 'top-right') {
      return toast.position === 'top-right' || !toast.position;
    }

    return toast.position === position;
  }

  function getSortedSlice(list: Array<ToastProps>) {
    const sorted = orderBy(list, (toast) => toast.id);

    return sorted.slice(0, maxToasts);
  }
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
