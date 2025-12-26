<script setup lang="ts">
  import d6_1 from '~/assets/icons/dice/d6-1.svg?raw';
  import d6_2 from '~/assets/icons/dice/d6-2.svg?raw';
  import d6_3 from '~/assets/icons/dice/d6-3.svg?raw';
  import d6_4 from '~/assets/icons/dice/d6-4.svg?raw';
  import d6_5 from '~/assets/icons/dice/d6-5.svg?raw';
  import d6_6 from '~/assets/icons/dice/d6-6.svg?raw';

  type D6 = 1 | 2 | 3 | 4 | 5 | 6;

  const { value, size = 24 } = defineProps<{
    value: D6;
    size?: number;
  }>();

  const svgByValue: Record<D6, string> = {
    1: d6_1,
    2: d6_2,
    3: d6_3,
    4: d6_4,
    5: d6_5,
    6: d6_6,
  };

  const svg = computed<string>(() => svgByValue[value]);

  const sizeStyle = computed<Record<string, string>>(() => ({
    width: `${size}px`,
    height: `${size}px`,
  }));
</script>

<template>
  <span
    class="inline-flex text-secondary"
    :style="sizeStyle"
    v-html="svg"
  />
</template>
