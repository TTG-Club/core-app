<script setup lang="ts">
  import type { CalculatorClassOption } from '../../model';

  defineProps<{
    classOptions: CalculatorClassOption[];
    classesPending: boolean;
  }>();

  const selectedClassUrl = defineModel<string | undefined>('selectedClassUrl');
  const level = defineModel<number>('level', { required: true });
</script>

<template>
  <div
    class="flex flex-col gap-6 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex flex-col gap-2">
      <div class="text-sm font-semibold">Класс</div>

      <UFieldGroup>
        <USelectMenu
          v-model="selectedClassUrl"
          :items="classOptions"
          :loading="classesPending"
          placeholder="Выберите класс"
          label-key="label"
          value-key="value"
          searchable
          class="w-full"
        >
          <template #item-trailing="{ item }">
            <UBadge
              variant="subtle"
              color="neutral"
            >
              {{ item.source }}
            </UBadge>
          </template>
        </USelectMenu>

        <UButton
          v-if="selectedClassUrl"
          icon="i-fluent-dismiss-24-regular"
          color="neutral"
          variant="subtle"
          @click="selectedClassUrl = undefined"
        />
      </UFieldGroup>

      <div class="text-xs text-secondary">
        Класс определяет уровни получения черт.
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">Уровень персонажа</span>

        <span class="text-sm font-bold text-primary">{{ level }}</span>
      </div>

      <USlider
        v-model="level"
        :min="1"
        :max="20"
      />
    </div>

    <slot name="epic-boon" />
  </div>
</template>
