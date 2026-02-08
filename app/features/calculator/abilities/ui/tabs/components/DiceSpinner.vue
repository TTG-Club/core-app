<script setup lang="ts">
  import { TransitionPresets, useTransition } from '@vueuse/core';

  import D6 from './D6.vue';

  const props = defineProps<{
    values: number[];
    droppedIndex?: number;
  }>();

  const DICE_SIZE = 44;
  const GAP_SIZE = 4; // gap-1 is 4px
  const DICE_FACES = 6;
  const STRIP_HEIGHT = (DICE_SIZE + GAP_SIZE) * DICE_FACES;

  // We use independent transitionable refs for each die to allow staggered animations
  const offset1 = ref(0);
  const offset2 = ref(0);
  const offset3 = ref(0);
  const offset4 = ref(0);

  const offsets = [offset1, offset2, offset3, offset4];

  const transitionOffsets = offsets.map((source, index) =>
    useTransition(source, {
      duration: 2000 + index * 200, // Staggered duration
      transition: TransitionPresets.easeOutCubic,
    }),
  );

  // Helper to calculate next target position
  function calculateNextPosition(current: number, targetFace: number) {
    const targetMod = (targetFace - 1) * (DICE_SIZE + GAP_SIZE);
    // Minimum spin distance (e.g. 5 full rotations)
    const minSpin = 5 * STRIP_HEIGHT;
    const nextBase = current + minSpin;

    const remainder = nextBase % STRIP_HEIGHT;

    let diff = targetMod - remainder;

    if (diff < 0) {
      diff += STRIP_HEIGHT;
    }

    return nextBase + diff;
  }

  watch(
    () => props.values,
    (newValues) => {
      newValues.forEach((val, i) => {
        if (offsets[i]) {
          offsets[i].value = calculateNextPosition(offsets[i].value, val);
        }
      });
    },
    { deep: true, immediate: true },
  );
</script>

<template>
  <div class="flex items-center justify-center gap-4 py-2">
    <div
      v-for="(offset, index) in transitionOffsets"
      :key="index"
      class="relative overflow-hidden"
      :style="{ width: `${DICE_SIZE}px`, height: `${DICE_SIZE}px` }"
    >
      <div
        class="flex flex-col gap-1"
        :style="{ transform: `translateY(-${offset.value % STRIP_HEIGHT}px)` }"
      >
        <!-- Render double strip for seamless wrapping -->
        <D6
          v-for="n in 12"
          :key="n"
          :value="((n - 1) % 6) + 1"
          :size="DICE_SIZE"
          :muted="props.droppedIndex === index"
          class="shrink-0"
        />
      </div>
    </div>
  </div>
</template>
