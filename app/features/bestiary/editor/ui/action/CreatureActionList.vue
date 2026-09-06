<script setup lang="ts">
  import type { CreateAction } from '~bestiary/model';

  import { createEmptyCreatureAction } from '~bestiary/model';

  import CreatureActionEntry from './CreatureActionEntry.vue';

  defineProps<{
    /** Подпись кнопки добавления: «Добавить действие», «Добавить реакцию». */
    addLabel: string;

    /**
     * Путь списка в состоянии формы существа: `actions`, `legendary.actions`,
     * `lair.effects`. Из него собирается путь записи для вложенной формы —
     * без него родительское сохранение не прогонит схему записи.
     */
    path: string;
  }>();

  const model = defineModel<Array<CreateAction>>({ default: () => [] });

  function isLast(index: number) {
    return index === model.value.length - 1;
  }

  function addAction() {
    model.value.push(createEmptyCreatureAction());
  }

  function removeAction(index: number) {
    model.value.splice(index, 1);
  }

  /**
   * Заменяет запись целиком.
   *
   * Запись правится по полям и приезжает тем же объектом, но присваивание
   * оставлено: `v-model` по индексу массива компилируется в него же, а через
   * обработчик выражение остаётся обычным JavaScript.
   *
   * @param index позиция записи в списке.
   * @param action новая запись.
   */
  function updateAction(index: number, action: CreateAction) {
    model.value[index] = action;
  }
</script>

<template>
  <div class="grid gap-4">
    <template
      v-for="(action, actionIndex) in model"
      :key="actionIndex"
    >
      <div class="grid grid-cols-24 gap-4">
        <CreatureActionEntry
          :model-value="action"
          :path="`${path}.${actionIndex}`"
          @update:model-value="updateAction(actionIndex, $event)"
          @remove="removeAction(actionIndex)"
        />
      </div>

      <USeparator v-if="!isLast(actionIndex)" />
    </template>

    <div class="flex justify-center">
      <UButton
        icon="tabler:plus"
        variant="soft"
        @click.left.exact.prevent="addAction"
      >
        {{ addLabel }}
      </UButton>
    </div>
  </div>
</template>
