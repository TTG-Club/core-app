<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SpeciesCreateSpeed } from '../../model';

  import {
    SPECIES_OPTIONAL_SPEED_KINDS,
    SPECIES_SPEED_EDITOR,
  } from '../../model';

  const speed = defineModel<SpeciesCreateSpeed>({ required: true });

  type OptionalSpeedKind = (typeof SPECIES_OPTIONAL_SPEED_KINDS)[number];

  /**
   * Есть ли у строки скорости переключатель «Парит».
   *
   * @param kind вид скорости строки.
   * @returns `true` только у полёта — парение без полёта не имеет смысла.
   */
  function isHoverKind(kind: OptionalSpeedKind): boolean {
    return kind === 'fly';
  }

  /**
   * Какие необязательные скорости показаны строками. Отдельное состояние, а не
   * проверка значения: строка с очищенным полем не должна пропадать из формы
   * посреди редактирования.
   */
  const visibleKinds = ref<Set<OptionalSpeedKind>>(new Set());

  // Загрузка записи приходит позже монтирования формы, поэтому заполненные
  // скорости раскрываются наблюдателем, а не разовой инициализацией. Цикла нет:
  // наблюдатель только добавляет виды в набор и модель не меняет.
  watch(
    speed,
    (value) => {
      for (const kind of SPECIES_OPTIONAL_SPEED_KINDS) {
        if (value[kind] != null) {
          visibleKinds.value.add(kind);
        }
      }
    },
    { immediate: true },
  );

  const visibleRows = computed(() =>
    SPECIES_OPTIONAL_SPEED_KINDS.filter((kind) => visibleKinds.value.has(kind)),
  );

  const hasHiddenKinds = computed(
    () => visibleKinds.value.size < SPECIES_OPTIONAL_SPEED_KINDS.length,
  );

  /** Меню «Добавить скорость»: только ещё не показанные виды. */
  const addMenuItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    SPECIES_OPTIONAL_SPEED_KINDS.filter(
      (kind) => !visibleKinds.value.has(kind),
    ).map((kind) => ({
      label: SPECIES_SPEED_EDITOR.labels[kind],
      onSelect: () => addSpeed(kind),
    })),
  ]);

  /**
   * Показывает строку скорости и заводит ей значение по умолчанию.
   *
   * @param kind вид скорости из меню «Добавить».
   */
  function addSpeed(kind: OptionalSpeedKind): void {
    visibleKinds.value.add(kind);

    speed.value = {
      ...speed.value,
      [kind]: SPECIES_SPEED_EDITOR.defaultValue,
    };
  }

  /**
   * Убирает строку скорости и очищает её значение. Вместе с полётом снимается и
   * признак «Парит» — без полёта он не имеет смысла.
   *
   * @param kind вид скорости строки.
   */
  function removeSpeed(kind: OptionalSpeedKind): void {
    visibleKinds.value.delete(kind);

    speed.value = {
      ...speed.value,
      [kind]: undefined,
      hover: isHoverKind(kind) ? false : speed.value.hover,
    };
  }
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="speed"
  >
    <UFormField
      class="col-span-full md:col-span-6"
      :label="SPECIES_SPEED_EDITOR.base"
      name="base"
    >
      <UInputNumber
        v-model="speed.base"
        :placeholder="SPECIES_SPEED_EDITOR.basePlaceholder"
        :min="0"
      />
    </UFormField>

    <div class="col-span-full flex flex-col gap-2">
      <div
        v-for="kind in visibleRows"
        :key="kind"
        class="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/40 p-2"
      >
        <span class="min-w-40 flex-1 truncate text-sm">
          {{ SPECIES_SPEED_EDITOR.labels[kind] }}
        </span>

        <UInputNumber
          v-model="speed[kind]"
          class="w-32"
          :min="0"
          :aria-label="SPECIES_SPEED_EDITOR.labels[kind]"
        />

        <UCheckbox
          v-if="isHoverKind(kind)"
          v-model="speed.hover"
          :label="SPECIES_SPEED_EDITOR.hover"
        />

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="SPECIES_SPEED_EDITOR.remove"
          @click.left.exact.prevent="removeSpeed(kind)"
        />
      </div>

      <UDropdownMenu
        v-if="hasHiddenKinds"
        :items="addMenuItems"
        :content="{ align: 'start' }"
      >
        <UButton
          icon="tabler:plus"
          :label="SPECIES_SPEED_EDITOR.add"
          color="primary"
          variant="soft"
          block
        />
      </UDropdownMenu>
    </div>
  </UForm>
</template>
