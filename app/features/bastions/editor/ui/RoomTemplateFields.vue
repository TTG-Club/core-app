<script setup lang="ts">
  import type { FacilityRoomTemplate } from '~bastion-game/model';

  import type { FacilitySpaceCode } from '../../model';

  import {
    createDefaultRoomTemplate,
    getRoomSizeOptions,
    resizeRoomTemplate,
  } from '~bastion-game/model';
  import { PlanRoomTemplateEditor } from '~bastion-game/plan';

  import { BASTION_EDITOR_LABELS } from '../../model';

  /**
   * Шаблоны готовой комнаты сооружения на плане бастиона: по вкладке на каждое
   * пространство, в котором сооружение бывает. Пока шаблона нет, план
   * расставляет мебель сам по виду сооружения; «Настроить» берёт эту
   * расстановку за основу.
   */
  const { facilityUrl, name, spaces } = defineProps<{
    /** Адрес сооружения: по нему выбирается мебель по умолчанию. */
    facilityUrl: string;
    /** Подпись комнаты на холсте. */
    name: string;
    /** Пространства сооружения с площадью. */
    spaces: Array<{ value: FacilitySpaceCode; name: string; squares: number }>;
  }>();

  const templates = defineModel<Array<FacilityRoomTemplate>>({
    required: true,
  });

  const activeSpace = ref<string>();

  const tabs = computed(() =>
    spaces.map((space) => ({
      label: `${space.name} (${space.squares} кв.)`,
      value: space.value,
    })),
  );

  // Пространства сменились (категория, расширение) — открыта первая вкладка.
  watch(
    () => spaces.map((space) => space.value).join(),
    () => {
      const isKnown = spaces.some((space) => space.value === activeSpace.value);

      if (!isKnown) {
        activeSpace.value = spaces[0]?.value;
      }
    },
    { immediate: true },
  );

  /** Открытая вкладка: пространство, его шаблон и варианты размера. */
  const active = computed(() => {
    const space = spaces.find((entry) => entry.value === activeSpace.value);

    if (!space) {
      return undefined;
    }

    const template = templates.value.find((item) => item.space === space.value);

    return {
      space,
      template,
      size: template ? `${template.width}x${template.depth}` : undefined,
      sizeItems: getRoomSizeOptions(space.squares).map(({ width, depth }) => ({
        label: `${width}×${depth}`,
        value: `${width}x${depth}`,
      })),
    };
  });

  /**
   * Заменяет шаблон пространства.
   *
   * @param space Пространство.
   * @param template Новый шаблон; `undefined` — вернуть автоматическую мебель.
   */
  function setTemplate(
    space: FacilitySpaceCode,
    template: FacilityRoomTemplate | undefined,
  ): void {
    const others = templates.value.filter((item) => item.space !== space);

    templates.value = template ? [...others, template] : others;
  }

  /** Создаёт шаблон открытого пространства из автоматической расстановки. */
  function customize(): void {
    if (active.value) {
      const { value, squares } = active.value.space;

      setTemplate(
        value,
        createDefaultRoomTemplate(facilityUrl, value, squares),
      );
    }
  }

  /**
   * Меняет размер комнаты открытого шаблона.
   *
   * @param value Размер вида `4x4`.
   */
  function resize(value: string): void {
    const template = active.value?.template;
    const [width, depth] = value.split('x').map(Number);

    if (template && width && depth) {
      setTemplate(template.space, resizeRoomTemplate(template, width, depth));
    }
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ BASTION_EDITOR_LABELS.roomTemplateTitle }}
      </h2>

      <p class="mt-1 text-sm text-muted">
        {{ BASTION_EDITOR_LABELS.roomTemplateHint }}
      </p>
    </template>

    <p
      v-if="!spaces.length"
      class="text-sm text-muted"
    >
      {{ BASTION_EDITOR_LABELS.roomTemplateNoSpaces }}
    </p>

    <template v-else>
      <UTabs
        v-model="activeSpace"
        :items="tabs"
        :content="false"
        variant="link"
      />

      <div
        v-if="active?.template"
        :key="active.space.value"
        class="flex flex-col gap-3 pt-4"
      >
        <div class="flex flex-wrap items-end gap-2">
          <UFormField :label="BASTION_EDITOR_LABELS.roomTemplateSize">
            <USelect
              :model-value="active.size"
              :items="active.sizeItems"
              value-key="value"
              class="w-32"
              @update:model-value="resize"
            />
          </UFormField>

          <UButton
            icon="tabler:restore"
            :label="BASTION_EDITOR_LABELS.roomTemplateReset"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="
              setTemplate(active.space.value, undefined)
            "
          />
        </div>

        <PlanRoomTemplateEditor
          :model-value="active.template"
          :name
          @update:model-value="(next) => setTemplate(next.space, next)"
        />
      </div>

      <div
        v-else-if="active"
        class="flex flex-col items-start gap-3 pt-4"
      >
        <p class="text-sm text-muted">
          {{ BASTION_EDITOR_LABELS.roomTemplateAuto }}
        </p>

        <UButton
          icon="tabler:layout-board"
          :label="BASTION_EDITOR_LABELS.roomTemplateCustomize"
          @click.left.exact.prevent="customize"
        />
      </div>
    </template>
  </UCard>
</template>
