<script setup lang="ts">
  import { TransitionPresets, useTransition } from '@vueuse/core';

  import DiceD6 from './DiceD6.vue';

  import type { DiceRollItem } from '~dice-roller/types';

  const { values, animate = true } = defineProps<{
    values: DiceRollItem[];
    animate?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'complete'): void;
  }>();

  const isAnimationCompleted = ref(false);

  const DICE_SIZE = 44;
  const GAP_SIZE = 4;
  const DICE_FACES = 6;
  const STRIP_HEIGHT = (DICE_SIZE + GAP_SIZE) * DICE_FACES;

  const offset1 = ref(0);
  const offset2 = ref(0);
  const offset3 = ref(0);
  const offset4 = ref(0);

  const offsets = [offset1, offset2, offset3, offset4];

  function calculateNextPosition(current: number, targetFace: number) {
    const targetMod = (targetFace - 1) * (DICE_SIZE + GAP_SIZE);
    const minSpin = 5 * STRIP_HEIGHT;
    const nextBase = current + minSpin;

    const remainder = nextBase % STRIP_HEIGHT;

    let diff = targetMod - remainder;

    if (diff < 0) {
      diff += STRIP_HEIGHT;
    }

    return nextBase + diff;
  }

  const transitionOffsets = offsets.map((source, index) => {
    return useTransition(source, {
      duration: computed(() => (animate ? 2000 + index * 200 : 0)),
      easing: TransitionPresets.easeOutCubic,
    });
  });

  function getDuration(index: number) {
    return 2000 + index * 200;
  }

  watch(
    () => values,
    (newValues) => {
      if (!newValues.length) {
        return;
      }

      isAnimationCompleted.value = !animate;

      newValues.forEach((roll, i) => {
        if (offsets[i]) {
          if (animate) {
            offsets[i].value = calculateNextPosition(
              offsets[i].value,
              roll.value,
            );
          } else {
            offsets[i].value = (roll.value - 1) * (DICE_SIZE + GAP_SIZE);
          }
        }
      });

      const maxDuration = animate ? getDuration(newValues.length - 1) : 0;

      if (animate) {
        setTimeout(() => {
          isAnimationCompleted.value = true;
          emit('complete');
        }, maxDuration + 50);
      } else {
        emit('complete');
      }
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
        <DiceD6
          v-for="n in 12"
          :key="n"
          :value="((n - 1) % 6) + 1"
          :size="DICE_SIZE"
          :muted="isAnimationCompleted && !values[index]?.valid"
          class="shrink-0"
        />
      </div>
    </div>
  </div>
</template>
