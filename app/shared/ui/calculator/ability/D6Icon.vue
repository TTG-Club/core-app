<script setup lang="ts">
  import { computed } from 'vue';

  import d6OneSvg from '~/assets/icons/dice/d6-1.svg?raw';
  import d6TwoSvg from '~/assets/icons/dice/d6-2.svg?raw';
  import d6ThreeSvg from '~/assets/icons/dice/d6-3.svg?raw';
  import d6FourSvg from '~/assets/icons/dice/d6-4.svg?raw';
  import d6FiveSvg from '~/assets/icons/dice/d6-5.svg?raw';
  import d6SixSvg from '~/assets/icons/dice/d6-6.svg?raw';

  type D6 = 1 | 2 | 3 | 4 | 5 | 6;

  const { value, size = 24 } = defineProps<{
    value: D6;
    size?: number;
  }>();

  const svgByValue: Record<D6, string> = {
    1: d6OneSvg,
    2: d6TwoSvg,
    3: d6ThreeSvg,
    4: d6FourSvg,
    5: d6FiveSvg,
    6: d6SixSvg,
  };

  const svg = computed<string>(() => {
    return svgByValue[value];
  });

  const sizeStyle = computed<Record<string, string>>(() => {
    return {
      width: `${size}px`,
      height: `${size}px`,
    };
  });
</script>

<template>
  <span
    class="inline-flex text-secondary"
    :style="sizeStyle"
    v-html="svg"
  />
</template>
