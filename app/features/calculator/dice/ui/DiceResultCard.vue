<script setup lang="ts">
  import { useDiceCalculator } from '../composables';
  import {
    createRollPartView,
    D20_SIDES,
    formatRollNumber,
    getRollBanner,
    RESULT_SPIN_INTERVAL,
    RESULT_SPIN_TICKS,
  } from '../model';

  const { result } = useDiceCalculator();

  const reducedMotion = usePreferredReducedMotion();

  const spinTicks = ref(RESULT_SPIN_TICKS);
  const spinValue = ref(0);
  const popKey = ref(0);

  const isSpinning = computed(() => spinTicks.value < RESULT_SPIN_TICKS);

  const { pause, resume } = useIntervalFn(
    () => {
      spinTicks.value += 1;

      if (spinTicks.value >= RESULT_SPIN_TICKS) {
        pause();
        popKey.value += 1;

        return;
      }

      spinValue.value = 1 + Math.floor(Math.random() * D20_SIDES);
    },
    RESULT_SPIN_INTERVAL,
    { immediate: false },
  );

  const displayedValue = computed(() => {
    if (!result.value) {
      return '—';
    }

    return isSpinning.value
      ? String(spinValue.value)
      : formatRollNumber(result.value.value);
  });

  const banner = computed(() =>
    result.value ? getRollBanner(result.value.parts) : null,
  );

  const bannerClass = computed(() =>
    banner.value?.success
      ? 'text-success ring-success/50'
      : 'text-error ring-error/50',
  );

  const partViews = computed(
    () => result.value?.parts.map(createRollPartView) ?? [],
  );

  // Каждый новый бросок «прокручивает» число, чтобы результат не подменялся
  // молча. Тем, кто просил меньше движения, число показывается сразу.
  watch(result, () => {
    if (reducedMotion.value === 'reduce') {
      spinTicks.value = RESULT_SPIN_TICKS;
      popKey.value += 1;

      return;
    }

    spinTicks.value = 0;
    spinValue.value = 1 + Math.floor(Math.random() * D20_SIDES);
    resume();
  });
</script>

<template>
  <section
    v-if="result"
    class="flex flex-col items-center gap-4 rounded-xl border border-default bg-muted px-4 py-6 text-center"
    aria-live="polite"
  >
    <div class="flex flex-col items-center gap-1">
      <p class="text-xs tracking-wide text-muted">{{ result.label }}</p>

      <p
        :key="popKey"
        class="text-6xl leading-tight font-bold text-highlighted tabular-nums"
        :class="$style.value"
      >
        {{ displayedValue }}
      </p>

      <p
        v-if="banner"
        class="w-fit rounded-full px-2.5 py-0.5 text-sm font-semibold ring"
        :class="bannerClass"
      >
        {{ banner.label }}
      </p>
    </div>

    <div class="flex flex-col items-center gap-2">
      <div
        v-for="part in partViews"
        :key="part.key"
        class="flex flex-wrap items-center justify-center gap-1.5"
      >
        <template v-if="part.check">
          <span class="text-sm text-muted">{{ part.label }} —</span>

          <b
            class="text-sm font-semibold"
            :class="part.check.success ? 'text-success' : 'text-error'"
          >
            {{ part.check.label }}
          </b>
        </template>

        <template v-else>
          <span class="min-w-11 text-right text-sm font-semibold text-muted">
            {{ part.label }}
          </span>

          <span
            v-for="face in part.faces"
            :key="face.key"
            class="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-base font-semibold tabular-nums ring"
            :class="{
              'text-highlighted ring-accented': face.highlight === 'none',
              'text-success ring-success': face.highlight === 'max',
              'text-error ring-error': face.highlight === 'min',
              'line-through opacity-40': face.dropped,
            }"
            :title="face.title"
          >
            {{ face.value }}

            <span
              v-if="face.rerolled"
              class="ml-0.5 text-[0.625rem] text-muted"
              aria-hidden="true"
            >
              ↻
            </span>
          </span>
        </template>
      </div>
    </div>
  </section>
</template>

<style module lang="scss">
  .value {
    animation: pop 0.25s ease-out;
  }

  @keyframes pop {
    0% {
      transform: scale(0.85);
      opacity: 0.4;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .value {
      animation: none;
    }
  }
</style>
