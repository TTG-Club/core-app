<script setup lang="ts">
  import type { Character } from '../types';

  defineProps<{
    passiveSenses: Character['passiveSenses'];
  }>();
</script>

<template>
  <div class="rounded-lg border border-default/50 bg-elevated/20 p-4">
    <h3 class="mb-3 text-xs font-bold text-muted uppercase">
      Пассивные чувства
    </h3>

    <div class="flex flex-col gap-4">
      <div
        class="flex items-center justify-between rounded-lg border border-default/50 bg-default/40 px-4 py-3"
      >
        <div class="flex flex-col">
          <span class="text-xs font-medium text-toned">Восприятие</span>

          <span class="text-[10px] text-dimmed uppercase">МУД</span>
        </div>

        <span class="text-xl font-bold text-highlighted">{{
          passiveSenses.perception
        }}</span>
      </div>

      <div
        class="flex items-center justify-between rounded-lg border border-muted/30 bg-elevated/40 px-4 py-3"
      >
        <div class="flex flex-col">
          <span class="text-xs font-medium text-toned">Проницательность</span>

          <span class="text-[10px] text-dimmed uppercase">МУД</span>
        </div>

        <span class="text-xl font-bold text-highlighted">{{
          passiveSenses.insight
        }}</span>
      </div>

      <div
        class="flex items-center justify-between rounded-lg border border-muted/30 bg-elevated/40 px-4 py-3"
      >
        <div class="flex flex-col">
          <span class="text-xs font-medium text-toned">Анализ</span>

          <span class="text-[10px] text-dimmed uppercase">ИНТ</span>
        </div>

        <span class="text-xl font-bold text-highlighted">{{
          passiveSenses.investigation
        }}</span>
      </div>
    </div>
  </div>
</template>
