<script setup lang="ts">
  import DiceD20IconUrl from '~/assets/icons/dice/d20.svg';
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const props = defineProps<{
    onSubmit: () => void;
  }>();

  const { formula } = useDiceRollerState();
</script>

<template>
  <form
    class="mt-3 flex items-center gap-2 border-t border-[var(--ui-border)] pt-3"
    @submit.prevent="props.onSubmit"
  >
    <UInput
      v-model="formula"
      placeholder="Например: 4к6вх3+2"
      size="xl"
      class="w-full"
    />

    <button
      type="submit"
      class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(0,0,0,0.22)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:outline-none"
      aria-label="Бросить кубы"
      title="Бросить"
    >
      <img
        :src="DiceD20IconUrl"
        alt="D20"
        class="h-5 w-5 transition dark:invert svifty7:invert"
      />
    </button>
  </form>
</template>
