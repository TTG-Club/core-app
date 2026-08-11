<script setup lang="ts">
  import type { ParticipantColor, TrackerParticipant } from '~initiative/model';

  import {
    DEFAULT_PARTICIPANT_COLOR,
    PARTICIPANT_COLOR_CLASS,
    PARTICIPANT_TYPE_ICON,
  } from '~initiative/model';

  const {
    participant,
    image = undefined,
    color = DEFAULT_PARTICIPANT_COLOR,
  } = defineProps<{
    participant: TrackerParticipant;
    /** URL картинки: статблок существа либо аватар листа персонажа. */
    image?: string;
    /** Цвет иконки — виден, только когда картинки нет. */
    color?: ParticipantColor;
  }>();

  defineEmits<{
    'image-error': [];
  }>();

  const isCreature = computed(() => participant.type === 'CREATURE');

  const colorClass = computed(() => PARTICIPANT_COLOR_CLASS[color]);

  // Аббревиатура игрока: инициалы двух слов либо две первые буквы одного.
  const initials = computed(() => {
    const words = participant.name.trim().split(/\s+/).filter(Boolean);
    const first = words[0];

    if (!first) {
      return '?';
    }

    const second = words[1];

    const base = second
      ? first.charAt(0) + second.charAt(0)
      : first.slice(0, 2);

    return base.toUpperCase();
  });
</script>

<template>
  <!-- size-11 — в высоту плиток статов строки, чтобы ряд был одной высоты. -->
  <div
    class="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border"
    :class="colorClass.surface"
  >
    <img
      v-if="image"
      :src="image"
      alt=""
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
      @error="$emit('image-error')"
    />

    <UIcon
      v-else-if="isCreature"
      :name="PARTICIPANT_TYPE_ICON.CREATURE"
      class="size-5"
      :class="colorClass.content"
    />

    <span
      v-else
      class="text-xs font-semibold uppercase tabular-nums"
      :class="colorClass.content"
    >
      {{ initials }}
    </span>
  </div>
</template>
