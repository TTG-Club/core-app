<script setup lang="ts">
  import { isUndefined } from 'lodash-es';
  import type { RatingValue } from './types';
  import { UIcon } from '#components';

  const {
    section,
    url,
    initial = undefined,
    size = 'medium',
  } = defineProps<{
    section: string;
    url: string;
    initial?: RatingValue;
    size?: 'small' | 'medium';
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
    return Math.round((star + (part + 1) * 0.25) * 4) / 4;
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

  const StarsRow = () =>
    h(
      'div',
      {
        class: 'flex gap-1',
        onMouseleave: () => (hoverRating.value = undefined),
      },
      Array.from({ length: 5 }, (_star, star) =>
        h(
          'div',
          { class: 'cursor-pointer flex size-5' },
          Array.from({ length: 4 }, (_part, part) =>
            h(
              'div',
              {
                class: [
                  'relative overflow-hidden w-1/4 h-full',
                  'transition-colors duration-100',
                  isHighlighted(star, part) ? 'text-highlight' : 'text-hover',
                ],
                onClick: withModifiers(
                  () => rate(star, part),
                  ['left', 'exact', 'prevent', 'stop'],
                ),
                onMouseover: () => (hoverRating.value = getRating(star, part)),
              },
              h(UIcon, {
                class: 'absolute top-0 duration-100',
                style: {
                  left: `${part * -5}px`,
                },
                name: 'i-fluent-star-16-filled',
                size: 20,
              }),
            ),
          ),
        ),
      ),
    );
</script>

<template>
  <div
    v-if="size === 'medium'"
    :class="[
      'flex flex-col justify-between gap-2',
      'h-28 w-full rounded-md bg-hover p-4 @md:max-w-50',
    ]"
  >
    <span><b>Рейтинг</b></span>

    <div class="flex items-center justify-between gap-1">
      <StarsRow />

      <div
        class="text-accent shrink-0 rounded-md bg-hover px-2 text-base leading-8 font-medium"
      >
        {{ safeRating }}
      </div>
    </div>

    <div class="text-xs">Оценок: {{ rating?.total || 0 }}</div>
  </div>

  <div
    v-else-if="size === 'small'"
    class="shrink-0"
  >
    <StarsRow />
  </div>
</template>
