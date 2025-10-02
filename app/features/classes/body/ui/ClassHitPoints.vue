<script setup lang="ts">
  import { UiCollapse } from '~ui/collapse';
  import type { HitDice } from '~classes/types';

  defineProps<{
    hitDice: HitDice;
  }>();
</script>

<template>
  <UiCollapse default-open>
    <template #default> Хиты</template>

    <template #content>
      <div class="mb-2">
        <span class="font-bold text-muted">Кость Хитов: </span>

        <span>1{{ hitDice.label }} за каждый уровень</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Хиты на 1 уровне: </span>

        <span>
          {{ hitDice.maxValue }} + ваш модификатор

          <span class="font-bold text-muted">Телосложения</span>
        </span>
      </div>

      <div>
        <span class="font-bold text-muted"> Хиты на следующих уровнях: </span>

        <span>
          1{{ hitDice.label }} (или {{ hitDice.avg }}) + модификатор
          <span class="font-bold text-muted"> Телосложения </span> за каждый
          уровень этого класса, после первого (минимум 1)
        </span>
      </div>
    </template>
  </UiCollapse>
</template>
