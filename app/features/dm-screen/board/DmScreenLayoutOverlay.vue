<script setup lang="ts">
  import type { ScreenLayoutTarget, ScreenPoint } from '../model';

  import { useDmScreenLayouts } from '../composables';
  import {
    DM_SCREEN_PICKER_CLASS,
    DM_SCREEN_TEXT,
    DM_SCREEN_ZONE_ATTRIBUTE,
    DM_SCREEN_ZONE_CLASS,
    getScreenWindowIcon,
    toScreenRectStyle,
    toScreenZoneStyle,
  } from '../model';

  /**
   * Раскладки окон поверх холста. Пока окно тащат: подсветка места, которое
   * оно займёт, и у края холста — панель раскладок (край выбирает мастер). После того как окно
   * встало в раскладку: в следующем свободном месте — список окон, которые
   * можно туда поставить; Escape или клик мимо заканчивает подбор.
   *
   * Указатель закреплён за шапкой окна, которое тащат, поэтому панель его
   * событий не получает: место под указателем ищется по координатам.
   */
  const {
    clientPointer,
    target,
    isPickerVisible,
    fittingLayouts,
    pickerPlacement,
    setPickerHeight,
    previewRect,
    assistRect,
    assistQueueRects,
    assistCandidates,
    setPickerTarget,
    place,
    skip,
    stopAssist,
  } = useDmScreenLayouts();

  /** Все места всех раскладок подряд: по номеру в списке их находят. */
  const pickerTargets = computed<Array<ScreenLayoutTarget>>(() =>
    fittingLayouts.value.flatMap((layout) =>
      layout.zones.map((_, zoneIndex) => ({ layout, zoneIndex })),
    ),
  );

  const pickerLayouts = computed(() =>
    fittingLayouts.value.map((layout) => ({
      key: layout.key,
      zones: layout.zones.map((zone, zoneIndex) => {
        const isActive =
          target.value?.layout === layout
          && target.value.zoneIndex === zoneIndex;

        const targetIndex = pickerTargets.value.findIndex(
          (candidate) =>
            candidate.layout === layout && candidate.zoneIndex === zoneIndex,
        );

        return {
          targetIndex,
          attributes: { [DM_SCREEN_ZONE_ATTRIBUTE]: targetIndex },
          style: toScreenZoneStyle(zone),
          class: isActive
            ? DM_SCREEN_ZONE_CLASS.active
            : DM_SCREEN_ZONE_CLASS.idle,
        };
      }),
    })),
  );

  /**
   * Место панели раскладок, над которым находится указатель.
   * @param client - указатель в окне браузера
   */
  function findPickerTarget(
    client: ScreenPoint,
  ): ScreenLayoutTarget | undefined {
    const zoneElement = document
      .elementsFromPoint(client.x, client.y)
      .find((element) => element.hasAttribute(DM_SCREEN_ZONE_ATTRIBUTE));

    const targetIndex = Number(
      zoneElement?.getAttribute(DM_SCREEN_ZONE_ATTRIBUTE),
    );

    return zoneElement ? pickerTargets.value[targetIndex] : undefined;
  }

  // После отрисовки: панель появляется от того же движения указателя
  watch(
    clientPointer,
    (client) => {
      setPickerTarget(
        client && isPickerVisible.value ? findPickerTarget(client) : undefined,
      );
    },
    { flush: 'post' },
  );

  const picker = useTemplateRef<HTMLElement>('picker');

  const { height: measuredPickerHeight } = useElementSize(picker);

  // Раскладки на узком холсте переносятся на вторую строку: полоса, в
  // которой панель видна, растёт вместе с ней. Спрятанная панель высоту не
  // сбрасывает — иначе нижние раскладки пропадали бы из-под указателя
  watch(measuredPickerHeight, (height) => {
    if (height > 0) {
      setPickerHeight(height);
    }
  });

  // Скрытую панель не рисуют вовсе, поэтому край у неё один из двух
  const pickerClass = computed(() =>
    pickerPlacement.value === 'bottom'
      ? DM_SCREEN_PICKER_CLASS.bottom
      : DM_SCREEN_PICKER_CLASS.top,
  );

  const previewStyle = computed(() =>
    previewRect.value ? toScreenRectStyle(previewRect.value) : undefined,
  );

  const assistStyle = computed(() =>
    assistRect.value ? toScreenRectStyle(assistRect.value) : undefined,
  );

  const queueStyles = computed(() =>
    assistQueueRects.value.map((rect) => ({
      key: `${rect.x}:${rect.y}`,
      style: toScreenRectStyle(rect),
    })),
  );

  const candidateButtons = computed(() =>
    assistCandidates.value.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      icon: getScreenWindowIcon(candidate.path),
    })),
  );

  onKeyStroke('Escape', stopAssist);
</script>

<template>
  <div
    v-if="previewStyle"
    :style="previewStyle"
    class="pointer-events-none absolute rounded-lg border-2 border-primary bg-primary/15"
  />

  <div
    v-if="isPickerVisible"
    ref="picker"
    aria-hidden="true"
    class="absolute inset-x-2 mx-auto flex w-fit flex-wrap justify-center gap-2 rounded-xl border border-default bg-elevated p-2 shadow-xl"
    :class="pickerClass"
  >
    <div
      v-for="layout in pickerLayouts"
      :key="layout.key"
      class="relative h-14 w-24"
    >
      <div
        v-for="zone in layout.zones"
        :key="zone.targetIndex"
        v-bind="zone.attributes"
        :style="zone.style"
        class="absolute p-0.5"
      >
        <div
          class="size-full rounded-sm border"
          :class="zone.class"
        />
      </div>
    </div>
  </div>

  <!--
    Пока подбираются окна, клик мимо места заканчивает подбор. Окна, ещё не
    поставленные в раскладку, уходят на второй план сами (`DmScreenWindow`).
  -->
  <div
    v-if="assistStyle"
    class="absolute inset-0 cursor-pointer"
    @click.left.exact.self.prevent.stop="stopAssist"
  />

  <div
    v-for="queued in queueStyles"
    :key="queued.key"
    :style="queued.style"
    class="pointer-events-none absolute rounded-lg border-2 border-dashed border-accented"
  />

  <section
    v-if="assistStyle"
    role="dialog"
    aria-modal="false"
    :aria-label="DM_SCREEN_TEXT.assistTitle"
    :style="assistStyle"
    class="absolute flex flex-col gap-2 overflow-y-auto rounded-lg border-2 border-dashed border-primary bg-default p-3 shadow-xl"
  >
    <!-- Кнопки в шапке: внизу справа их закрывала бы кнопка кубиков -->
    <div class="flex items-center gap-2">
      <h2 class="min-w-0 flex-auto truncate text-sm text-muted">
        {{ DM_SCREEN_TEXT.assistTitle }}
      </h2>

      <UButton
        :label="DM_SCREEN_TEXT.assistSkip"
        color="neutral"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="skip"
      />

      <UButton
        :label="DM_SCREEN_TEXT.assistStop"
        color="neutral"
        variant="outline"
        size="sm"
        @click.left.exact.prevent="stopAssist"
      />
    </div>

    <UButton
      v-for="candidate in candidateButtons"
      :key="candidate.id"
      :icon="candidate.icon"
      :label="candidate.title"
      color="neutral"
      variant="soft"
      class="justify-start"
      :ui="{ label: 'truncate', leadingIcon: 'text-primary' }"
      @click.left.exact.prevent="place(candidate.id)"
    />
  </section>
</template>
