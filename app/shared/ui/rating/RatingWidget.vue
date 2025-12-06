<script setup lang="ts">
  import { isUndefined } from 'lodash-es';
  import type { RatingValue } from './types';

  const {
    section,
    url,
    initial = undefined,
  } = defineProps<{
    section: string;
    url: string;
    initial?: RatingValue;
  }>();

  const $toast = useToast();

  function showSuccess(msg: string) {
    $toast.add({
      color: 'success',
      title: msg,
    });
  }

  function showError(msg: string) {
    $toast.add({
      color: 'error',
      title: msg,
    });
  }

  const hoverRating = ref<number>();

  const { data: rating, refresh } = await useAsyncData(
    `rating-${section}-${url}`,
    () =>
      $fetch<RatingValue>('/api/v2/rating', {
        params: {
          section: section,
          url: url,
        },
      }),
    {
      watch: [() => url, () => section],
      lazy: true,
      dedupe: 'defer',
      immediate: !initial,
      default: () => initial,
    },
  );

  const safeRating = computed(() => rating.value?.value ?? 0);

  function isHighlighted(star: number, part: number) {
    const value = isUndefined(hoverRating.value)
      ? safeRating.value
      : hoverRating.value;

    const targetRating = getRating(star, part);

    return value >= targetRating;
  }

  function getRating(star: number, part: number) {
    return Math.round((star - 1 + part * 0.25) * 4) / 4;
  }

  function rate(star: number, part: number) {
    return $fetch('/api/v2/rating', {
      method: 'POST',
      body: {
        section: section,
        url: url,
        value: getRating(star, part),
      },
      onResponse: (res) => {
        if (!res.response.ok) {
          return;
        }

        refresh().finally(() => {
          showSuccess('Спасибо за оценку!');

          hoverRating.value = undefined;
        });
      },
      onResponseError: (error) => {
        if (error.response.status === 403) {
          showError(
            'Зарегистрируйтесь или войдите в свой аккаунт, чтобы оставлять оценки.',
          );

          return;
        }

        showError('Ошибка сохранения оценки');
      },
    });
  }
</script>

<template>
  <div :class="$style.rating">
    <span><b>Рейтинг</b></span>

    <div :class="$style.block">
      <div
        :class="$style.stars"
        @mouseleave="hoverRating = undefined"
      >
        <div
          v-for="star in 5"
          :key="star"
          :class="$style.star"
        >
          <div
            v-for="part in 4"
            :key="part"
            :class="[
              $style.part,
              { [$style.highlight]: isHighlighted(star, part) },
            ]"
            @mouseover="hoverRating = getRating(star, part)"
            @click.left.exact.prevent.stop="rate(star, part)"
          >
            <UIcon
              :class="$style.icon"
              name="i-fluent-star-16-filled"
              size="20"
            />
          </div>
        </div>
      </div>

      <div :class="$style.result">{{ safeRating }}</div>
    </div>

    <div :class="$style.total">Оценок: {{ rating?.total || 0 }}</div>
  </div>
</template>

<style module lang="scss">
  @use 'sass:math';

  .rating {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 4px;
    justify-content: space-between;

    width: 100%;
    height: 110px;
    padding: 12px 12px;
    border-radius: 8px;

    background: var(--color-hover);

    @container (width > 600px) {
      max-width: 200px;
    }
  }

  .stars {
    display: flex;
    gap: 4px;

    .star {
      cursor: pointer;
      display: flex;
      width: 20px;
      height: 20px;
    }

    .part {
      position: relative;

      overflow: hidden;

      width: 25%;
      height: 100%;

      color: var(--color-hover);

      & {
        @include css-anim($time: 0.1s);
      }

      @for $i from 1 through 4 {
        &:nth-child(#{ $i }) {
          $index: $i - 1;
          $part: math.div(20, -4);
          $delta: $index * $part;

          .icon {
            left: #{$delta}px;
          }
        }
      }

      .icon {
        position: absolute;
        top: 0;

        & {
          @include css-anim($time: 0.1s);
        }
      }

      &.highlight {
        color: var(--ui-text-bold);
      }
    }
  }

  .field {
    flex: 1 1 100%;
  }

  .block {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: space-between;
  }

  .result {
    display: flex;
    flex-shrink: 0;
    align-items: flex-end;

    padding: 0 8px;
    border-radius: 8px;

    font-size: 16px;
    font-weight: 500;
    line-height: 32px;
    color: var(--ui-text-bold);

    background: var(--color-hover);
  }
  .total {
    font-size: 12px;
  }
</style>
