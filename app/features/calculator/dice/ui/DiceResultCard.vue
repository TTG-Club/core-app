<script setup lang="ts">
  import type { RollTone } from '../model';

  import { useDiceCalculator } from '../composables';
  import {
    createRollPartView,
    D20_SIDES,
    DICE_ICONS,
    DICE_RESULT_LABELS,
    EMPTY_VALUE_PLACEHOLDER,
    formatRollNumber,
    getResultValueSizeClass,
    getRollBanner,
    REROLLED_FACE_MARK,
    RESULT_SPIN_INTERVAL,
    RESULT_SPIN_TICKS,
    ROLL_BANNER_CLASSES,
    ROLL_TONE_COLORS,
  } from '../model';
  import DiceOrnatePanel from './DiceOrnatePanel.vue';
  import DiceTwentyEmblem from './DiceTwentyEmblem.vue';

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
      return EMPTY_VALUE_PLACEHOLDER;
    }

    return isSpinning.value
      ? String(spinValue.value)
      : formatRollNumber(result.value.value);
  });

  const valueSizeClass = computed(() =>
    getResultValueSizeClass(displayedValue.value),
  );

  const banner = computed(() =>
    result.value ? getRollBanner(result.value.parts) : null,
  );

  // Пока кость катится, исход ещё «не известен»: ни лента, ни цвет подноса
  // не должны выдавать его раньше числа.
  const landedBanner = computed(() => (isSpinning.value ? null : banner.value));

  const tone = computed<RollTone>(() => {
    if (!landedBanner.value) {
      return 'neutral';
    }

    return landedBanner.value.success ? 'success' : 'failure';
  });

  // Кость кувыркается ровно столько, сколько «прокручивается» число.
  const trayStyle = computed(() => ({
    '--die-color': ROLL_TONE_COLORS[tone.value],
    '--spin-duration': `${RESULT_SPIN_TICKS * RESULT_SPIN_INTERVAL}ms`,
  }));

  const bannerClass = computed(() => ROLL_BANNER_CLASSES[tone.value]);

  const styles = useCssModule();

  const dieClass = computed(() => [
    styles.die,
    isSpinning.value ? styles.rolling : undefined,
  ]);

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
  <DiceOrnatePanel
    :label="DICE_RESULT_LABELS.section"
    :icon="DICE_ICONS.tray"
  >
    <!-- Сукно подноса: на него «падает» кость с результатом. Цвет кости и
      свечения приходит из `--die-color` — он меняется на удаче и неудаче -->
    <div
      class="relative flex min-h-64 flex-col items-center justify-center gap-4 overflow-hidden rounded-lg px-3 py-6 text-center ring ring-default lg:min-h-96"
      :class="$style.tray"
      :style="trayStyle"
      aria-live="polite"
    >
      <template v-if="result">
        <p class="font-mono text-xs break-all text-muted">
          {{ result.label }}
        </p>

        <div
          class="relative mb-3 grid size-40 place-items-center sm:size-48"
          :class="dieClass"
        >
          <DiceTwentyEmblem
            class="absolute inset-0 size-full"
            :class="$style.emblem"
          />

          <div
            :key="popKey"
            class="absolute inset-0 grid place-items-center pt-2"
          >
            <span
              v-if="!isSpinning"
              class="absolute inset-0 rounded-full"
              :class="$style.ripple"
              aria-hidden="true"
            />

            <p
              class="relative font-display leading-none font-bold text-highlighted lining-nums tabular-nums"
              :class="[valueSizeClass, $style.value]"
            >
              {{ displayedValue }}
            </p>
          </div>

          <!-- Лента исхода лежит поверх основания кости и не занимает своей
            строки: у большинства бросков её нет, и пустое место под ней
            раздвигало бы поднос -->
          <p
            v-if="landedBanner"
            class="absolute -bottom-3 left-1/2 animate-appear rounded-full bg-default px-3 py-0.5 text-sm font-semibold whitespace-nowrap ring"
            :class="[bannerClass, $style.banner]"
          >
            {{ landedBanner.label }}
          </p>
        </div>

        <div
          v-if="partViews.length"
          class="flex w-full flex-col items-center gap-2 border-t border-default pt-4"
          :aria-label="DICE_RESULT_LABELS.breakdown"
        >
          <div
            v-for="part in partViews"
            :key="part.key"
            class="flex flex-wrap items-center justify-center gap-1.5"
          >
            <template v-if="part.check">
              <span class="text-sm text-muted">{{ part.label }} —</span>

              <b
                class="text-sm font-semibold"
                :class="part.check.className"
              >
                {{ part.check.label }}
              </b>
            </template>

            <template v-else>
              <span
                class="min-w-11 text-right font-mono text-sm font-semibold text-muted"
              >
                {{ part.label }}
              </span>

              <span
                v-for="face in part.faces"
                :key="face.key"
                class="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 text-base font-semibold tabular-nums ring"
                :class="face.className"
                :title="face.title"
              >
                {{ face.value }}

                <span
                  v-if="face.rerolled"
                  class="ml-0.5 text-[10px] text-muted"
                  aria-hidden="true"
                >
                  {{ REROLLED_FACE_MARK }}
                </span>
              </span>
            </template>
          </div>
        </div>
      </template>

      <template v-else>
        <DiceTwentyEmblem class="size-28 text-dimmed opacity-70 sm:size-32" />

        <div class="flex flex-col items-center gap-1">
          <p class="font-display text-2xl font-semibold text-highlighted">
            {{ DICE_RESULT_LABELS.emptyTitle }}
          </p>

          <p class="max-w-xs text-sm text-balance text-muted">
            {{ DICE_RESULT_LABELS.emptyHint }}
          </p>
        </div>
      </template>
    </div>
  </DiceOrnatePanel>
</template>

<style module lang="scss">
  /* Сукно: свечение под костью, поверх — редкая диагональная «ткань» и тень
     от бортов подноса */
  .tray {
    --weave: color-mix(in oklab, var(--ui-text) 3%, transparent);

    background:
      radial-gradient(
        75% 60% at 50% 42%,
        color-mix(in oklab, var(--die-color) 14%, transparent),
        transparent 72%
      ),
      repeating-linear-gradient(45deg, var(--weave) 0 1px, transparent 1px 7px),
      repeating-linear-gradient(
        -45deg,
        var(--weave) 0 1px,
        transparent 1px 7px
      ),
      var(--ui-bg);
    box-shadow: inset 0 2px 14px rgb(0 0 0 / 22%);
  }

  .die {
    color: var(--die-color);
    filter: drop-shadow(
      0 8px 18px color-mix(in oklab, var(--die-color) 35%, transparent)
    );
    transition: color 0.3s ease-out;
  }

  .rolling .emblem {
    animation: tumble var(--spin-duration) cubic-bezier(0.3, 0.6, 0.4, 1);
  }

  /* Ореол цвета сукна отделяет число от рёбер кости под ним */
  .value {
    text-shadow:
      0 0 4px var(--ui-bg),
      0 0 14px var(--ui-bg);
    animation: pop 0.25s ease-out;
  }

  .ripple {
    border: 2px solid var(--die-color);
    opacity: 0;
    animation: ripple 0.7s ease-out;
  }

  .banner {
    transform: translateX(-50%);
  }

  @keyframes tumble {
    0% {
      transform: rotate(-150deg) scale(0.7);
    }

    60% {
      transform: rotate(14deg) scale(1.06);
    }

    100% {
      transform: rotate(0) scale(1);
    }
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

  @keyframes ripple {
    0% {
      transform: scale(0.6);
      opacity: 0.7;
    }

    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .value,
    .ripple,
    .rolling .emblem {
      animation: none;
    }
  }
</style>
