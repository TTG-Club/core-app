<script setup lang="ts">
  import type { TrackerParticipant } from '~initiative/model';

  import { PARTICIPANT_TYPE_ICON } from '~initiative/model';

  const { participant, image = undefined } = defineProps<{
    participant: TrackerParticipant;
    /** URL картинки существа из бестиария (для игроков — не задаётся). */
    image?: string;
  }>();

  defineEmits<{
    'image-error': [];
  }>();

  const isCreature = computed(() => participant.type === 'CREATURE');

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
    class="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-default bg-elevated"
  >
    <img
      v-if="isCreature && image"
      :src="image"
      alt=""
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
      @error="$emit('image-error')"
    />

    <UIcon
      v-else-if="isCreature"
      :name="PARTICIPANT_TYPE_ICON.CREATURE"
      class="size-5 text-secondary"
    />

    <span
      v-else
      class="text-xs font-semibold text-secondary uppercase tabular-nums"
    >
      {{ initials }}
    </span>
  </div>
</template>
