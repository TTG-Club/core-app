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
      onResponse: () => {
        hoverRating.value = undefined;

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
  <div :class="$style.rating">
    <div :class="$style.stars">
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
          @mouseleave="hoverRating = undefined"
          @click.left.exact.prevent="rate(star, part)"
        >
          <SvgIcon
            :class="[$style.icon, $style.outline]"
            icon="star/outline/default"
            size="24"
          />

          <SvgIcon
            :class="[$style.icon, $style.filled]"
            icon="star/filled/default"
            size="24"
          />
        </div>
      </div>
    </div>

    <div :class="$style.result">{{ safeRating }}</div>

    <div :class="$style.info">
      <div>Оценок:</div>

      <div>{{ rating?.total || 0 }}</div>
    </div>
  </div>
</template>

<style module lang="scss">
  @use 'sass:math';

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
      width: 24px;
      height: 24px;
    }

    .part {
      position: relative;

      overflow: hidden;

      width: 25%;
      height: 100%;

      color: var(--color-text);

      & {
        @include css-anim($time: 0.1s);
      }

      @for $i from 1 through 4 {
        &:nth-child(#{ $i }) {
          $index: $i - 1;
          $part: math.div(24, -4);
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

        &.filled {
          opacity: 0;
        }
      }

      &.highlight {
        color: var(--color-primary);

        .icon {
          &.outline {
            opacity: 0;
          }

          &.filled {
            opacity: 1;
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
