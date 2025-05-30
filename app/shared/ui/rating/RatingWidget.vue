<script setup lang="ts">
  import { isUndefined } from 'lodash-es';

  import { SvgIcon } from '~ui/icon';
  import { useToast } from '~ui/toast';

  const { section, url } = defineProps<{
    section: string;
    url: string;
  }>();

  const $toast = useToast();

  const hoverRating = ref<number>();

  const { data: rating, refresh } = await useAsyncData(
    `rating-${section}-${url}`,
    () =>
      $fetch<{ value: number; total: number }>('/api/v2/rating', {
        params: {
          section: section,
          url: url,
        },
      }),
    { watch: [() => url, () => section] },
  );

  function isHighlighted(star: number, half: number, isHovering = false) {
    const value = !isHovering ? rating.value?.value : hoverRating.value;

    if (isUndefined(value)) {
      return false;
    }

    const result = getRating(star, half);

    return Math.round(value * 4) / 4 >= result;
  }

  function getRating(star: number, half: number) {
    return star - 1 + half * 0.25;
  }

  function rate(star: number, half: number) {
    return $fetch('/api/v2/rating', {
      method: 'POST',
      body: {
        section: section,
        url: url,
        value: getRating(star, half),
      },
      onResponse: () => {
        $toast.success({
          title: 'Спасибо за оценку!',
        });

        refresh();
      },
      onResponseError: (error) => {
        if (error.response.status === 403) {
          $toast.error({
            title: 'Ошибка сохранения оценки',
            description:
              'Зарегистрируйтесь или войдите в свой аккаунт, чтобы оставлять оценки.',
          });

          return;
        }

        $toast.error({
          title: 'Ошибка сохранения оценки',
          description: 'Обратитесь за помощью на наш Discord сервер.',
        });
      },
    });
  }
</script>

<template>
  <div
    v-if="rating"
    :class="$style.rating"
  >
    <div :class="$style.stars">
      <div
        v-for="star in 5"
        :key="star"
        :class="$style.star"
      >
        <div
          v-for="half in 4"
          :key="half"
          :class="[
            $style.half,
            {
              [$style.rated]: isHighlighted(star, half) && !hoverRating,
              [$style.hover]: isHighlighted(star, half, true),
            },
          ]"
          @mouseover="hoverRating = getRating(star, half)"
          @mouseleave="hoverRating = undefined"
          @click.left.exact.prevent="rate(star, half)"
        >
          <SvgIcon
            icon="dice/d20"
            size="28"
          />
        </div>
      </div>
    </div>

    <div :class="$style.result">{{ rating.value }}</div>

    <div :class="$style.info">
      <div>Оценок:</div>

      <div>{{ rating.total }}</div>
    </div>
  </div>
</template>

<style module lang="scss">
  .rating {
    display: flex;
    gap: 8px;
    align-items: center;

    padding: 4px 12px;
    border-radius: 8px;

    background: var(--color-hover);

    @container (width > 600px) {
      max-width: 320px;
    }
  }

  .stars {
    display: flex;
    flex: 1 1 auto;

    .star {
      cursor: pointer;
      display: flex;
      width: 28px;
      height: 28px;
    }

    .half {
      position: relative;

      overflow: hidden;
      display: flex;
      align-items: center;

      width: 25%;
      height: 100%;

      color: var(--color-text);

      & {
        @include css-anim($time: 0.1s);
      }

      &.hover,
      &.rated {
        color: var(--color-primary);
      }

      svg {
        position: absolute;
        top: 0;
      }

      @for $i from 1 through 4 {
        &:nth-child(#{ $i }) {
          svg {
            left: calc(($i - 1) * -25%);
          }
        }
      }
    }
  }

  .field {
    flex: 1 1 100%;
  }

  .result {
    display: flex;
    flex-shrink: 0;
    align-items: flex-end;

    padding: 0 12px;
    border-radius: 8px;

    font-size: 20px;
    font-weight: 500;
    line-height: 32px;
    color: var(--color-text-bold);

    background: var(--color-hover);
  }

  .info {
    font-size: 10px;
  }
</style>
