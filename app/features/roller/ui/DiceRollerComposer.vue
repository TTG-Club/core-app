<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  import DiceRollerHelpPopover from './DiceRollerHelpPopover.vue';

  const props = defineProps<{
    onSubmit: () => void;
  }>();

  const { formula } = useDiceRollerState();
</script>

<template>
  <form
    class="mt-3 flex items-center gap-2 border-t border-default pt-3"
    @submit.prevent="props.onSubmit"
  >
    <UInput
      v-model="formula"
      placeholder="Например: 1к20+5"
      size="xl"
      class="w-full"
    >
      <template #trailing>
        <DiceRollerHelpPopover />
      </template>
    </UInput>

    <UButton
      type="submit"
      icon="i-heroicons-paper-airplane-20-solid"
      size="xl"
      color="primary"
      variant="soft"
      class="rounded-md shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition"
      aria-label="Бросить кубы"
      title="Кидай!"
    />
  </form>
</template>
