<script setup lang="ts">
  import type { CreateSpeed, CreateSpeeds } from '../../model';

  import { isEqual } from 'es-toolkit';

  import { getEmptyCreatureSpeed, SpeedType } from '../../model';
  import {
    CREATURE_SPEED_EDITOR,
    CREATURE_SPEED_TYPE_LABELS,
    CREATURE_SPEED_TYPES,
  } from '../constants';

  /**
   * Скорости существа одним списком: заведённые идут строками по видам, а
   * пустые виды места не занимают — их добавляют кнопками под списком. Раньше
   * каждый вид был своей карточкой, и существо с одной ходьбой занимало пять
   * карточек, четыре из которых — одна кнопка «Добавить».
   */
  const model = defineModel<CreateSpeeds>({ required: true });

  /** Заведена хотя бы одна скорость: иначе вместо списка — подсказка. */
  const hasSpeeds = computed(() =>
    CREATURE_SPEED_TYPES.some((type) => model.value[type].length > 0),
  );

  /**
   * Скорость вида можно удалить. Единственную ходьбу не удаляют, а очищают:
   * она есть у любого существа, и статблок начинается с неё.
   *
   * @param type - вид скорости
   */
  function isSpeedRemovable(type: SpeedType): boolean {
    return type !== SpeedType.WALK || model.value[type].length > 1;
  }

  /**
   * Скорость совпадает с пустой — очищать нечего.
   *
   * @param type - вид скорости
   * @param speed - скорость из списка вида
   */
  function isSpeedEmpty(type: SpeedType, speed: CreateSpeed): boolean {
    return isEqual(speed, getEmptyCreatureSpeed(type));
  }

  /**
   * Добавляет скорость вида в конец его списка. Вторая скорость того же вида —
   * обычное дело: «30 фт., 40 фт. в облике волка».
   *
   * @param type - вид скорости
   */
  function addSpeed(type: SpeedType): void {
    model.value[type].push(getEmptyCreatureSpeed(type));
  }

  /**
   * Убирает скорость из списка её вида.
   *
   * @param type - вид скорости
   * @param index - место скорости в списке вида
   */
  function removeSpeed(type: SpeedType, index: number): void {
    model.value[type].splice(index, 1);
  }

  /**
   * Сбрасывает скорость к пустой, не убирая строку.
   *
   * @param type - вид скорости
   * @param index - место скорости в списке вида
   */
  function clearSpeed(type: SpeedType, index: number): void {
    model.value[type].splice(index, 1, getEmptyCreatureSpeed(type));
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ CREATURE_SPEED_EDITOR.title }}
      </h2>
    </template>

    <div class="flex flex-col gap-4">
      <!-- Колонки у строк общие (subgrid): пояснение начинается на одной линии
        во всех строках, хотя отметка «Парит» есть только у полёта. На телефоне
        строка переносится: пояснение с кнопкой уходят на вторую линию, а
        подпись и число сужены, чтобы «Парит» поместился в первую -->
      <div
        v-if="hasSpeeds"
        class="grid grid-cols-1 gap-3 md:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] md:items-center"
      >
        <template
          v-for="type in CREATURE_SPEED_TYPES"
          :key="type"
        >
          <div
            v-for="(speed, index) in model[type]"
            :key="`${type}-${index}`"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 md:col-span-full md:grid md:grid-cols-subgrid"
          >
            <span
              class="w-20 shrink-0 text-sm font-medium text-highlighted md:w-auto"
            >
              {{ CREATURE_SPEED_TYPE_LABELS[type] }}
            </span>

            <UFieldGroup class="shrink-0">
              <UInputNumber
                v-model="speed.value"
                :min="0"
                :aria-label="CREATURE_SPEED_TYPE_LABELS[type]"
                class="w-24 md:w-28"
              />

              <UBadge
                color="neutral"
                variant="subtle"
              >
                {{ CREATURE_SPEED_EDITOR.unit }}
              </UBadge>
            </UFieldGroup>

            <UCheckbox
              v-if="type === SpeedType.FLY"
              v-model="speed.hover"
              :label="CREATURE_SPEED_EDITOR.hover"
              class="shrink-0 md:col-start-3"
            />

            <div class="flex basis-full items-center gap-3 md:contents">
              <UInput
                v-model="speed.text"
                :placeholder="CREATURE_SPEED_EDITOR.textPlaceholder"
                :aria-label="CREATURE_SPEED_EDITOR.text"
                class="w-full min-w-0 md:col-start-4"
              />

              <UTooltip
                v-if="isSpeedRemovable(type)"
                :text="CREATURE_SPEED_EDITOR.remove"
              >
                <UButton
                  :icon="CREATURE_SPEED_EDITOR.removeIcon"
                  color="error"
                  variant="ghost"
                  class="shrink-0 md:col-start-5"
                  :aria-label="CREATURE_SPEED_EDITOR.remove"
                  @click.left.exact.prevent="removeSpeed(type, index)"
                />
              </UTooltip>

              <UTooltip
                v-else
                :text="CREATURE_SPEED_EDITOR.clear"
              >
                <UButton
                  :icon="CREATURE_SPEED_EDITOR.clearIcon"
                  color="error"
                  variant="ghost"
                  class="shrink-0 md:col-start-5"
                  :disabled="isSpeedEmpty(type, speed)"
                  :aria-label="CREATURE_SPEED_EDITOR.clear"
                  @click.left.exact.prevent="clearSpeed(type, index)"
                />
              </UTooltip>
            </div>
          </div>
        </template>
      </div>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ CREATURE_SPEED_EDITOR.empty }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">{{ CREATURE_SPEED_EDITOR.add }}</span>

        <UButton
          v-for="type in CREATURE_SPEED_TYPES"
          :key="type"
          :label="CREATURE_SPEED_TYPE_LABELS[type]"
          :icon="CREATURE_SPEED_EDITOR.addIcon"
          variant="subtle"
          size="sm"
          @click.left.exact.prevent="addSpeed(type)"
        />
      </div>
    </div>
  </UCard>
</template>
