<script setup lang="ts">
  import { UiCollapse } from '~ui/collapse';

  import type { ClassDetailResponse, ClassProficiency } from '~classes/types';

  defineProps<{
    proficiency: ClassProficiency;
    savingThrows: ClassDetailResponse['savingThrows'];
  }>();
</script>

<template>
  <UiCollapse default-open>
    <template #default> Владения</template>

    <template #content>
      <div class="mb-2">
        <span class="font-bold text-muted">Доспехи: </span>

        <span>{{ proficiency.armor || 'Нет' }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Оружие: </span>

        <span>{{ proficiency.weapon || 'Нет' }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Инструменты: </span>

        <span>{{ proficiency.tool || 'Нет' }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted"> Спасброски: </span>

        <span>{{ savingThrows }}</span>
      </div>

      <div v-if="proficiency.skill">
        <span class="font-bold text-muted">Навыки: </span>

        <span>{{ proficiency.skill }}</span>
      </div>
    </template>
  </UiCollapse>
</template>
