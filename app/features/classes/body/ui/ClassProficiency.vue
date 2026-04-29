<script setup lang="ts">
  import type {
    ClassDetailResponse,
    ClassMulticlassProficiency,
    ClassProficiency,
  } from '../../model';

  import { UiCollapse } from '~ui/collapse';

  defineProps<{
    proficiency: ClassProficiency;
    multiclassProficiency?: ClassMulticlassProficiency;
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

      <template v-if="multiclassProficiency">
        <div class="mt-4 mb-2">
          <span class="font-bold text-muted">
            Доспехи при мультиклассировании:
          </span>

          <span>{{ multiclassProficiency.armor || 'Нет' }}</span>
        </div>

        <div class="mb-2">
          <span class="font-bold text-muted">
            Оружие при мультиклассировании:
          </span>

          <span>{{ multiclassProficiency.weapon || 'Нет' }}</span>
        </div>

        <div class="mb-2">
          <span class="font-bold text-muted">
            Инструменты при мультиклассировании:
          </span>

          <span>{{ multiclassProficiency.toolProficiency || 'Нет' }}</span>
        </div>

        <div>
          <span class="font-bold text-muted">
            Навыки на выбор при мультиклассировании:
          </span>

          <span>{{ multiclassProficiency.skills || 'Нет' }}</span>
        </div>
      </template>
    </template>
  </UiCollapse>
</template>
