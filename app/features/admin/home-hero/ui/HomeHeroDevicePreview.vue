<script setup lang="ts">
  import type { HomeHeroPreviewDevice } from '../model';

  const { device, src, revision } = defineProps<{
    device: HomeHeroPreviewDevice;
    /** Адрес страницы превью — с черновиком или без. */
    src: string;
    /** Версия сохранённого фона: с её сменой фрейм загружается заново. */
    revision: number;
  }>();

  const screenRef = useTemplateRef<HTMLElement>('screenRef');
  const { width: screenWidth } = useElementSize(screenRef);

  const caption = computed(
    () => `${device.label} · ${device.width} × ${device.height}`,
  );

  // Фрейм пересоздаётся, а не меняет `src`: переход внутри фрейма лёг бы в
  // историю вкладки, и «Назад» листал бы превью. Без черновика адрес один и
  // тот же — после публикации и сброса пересоздание даёт смена версии
  const frameKey = computed(() => `${revision}:${src}`);

  const screenStyle = computed(() => ({
    aspectRatio: `${device.width} / ${device.height}`,
  }));

  // Фрейм живёт в настоящем размере экрана и уменьшается целиком: так шапка
  // внутри видит ту же ширину окна, что у посетителя с этим экраном
  const frameStyle = computed(() => ({
    width: `${device.width}px`,
    height: `${device.height}px`,
    transform: `scale(${screenWidth.value / device.width})`,
  }));
</script>

<template>
  <figure class="flex min-w-0 flex-col gap-2">
    <div
      ref="screenRef"
      class="relative w-full overflow-hidden rounded-md border border-default bg-default"
      :style="screenStyle"
    >
      <!-- Пока ширина не измерена, масштаб нулевой — фрейм не грузим зря -->
      <iframe
        v-if="screenWidth"
        :key="frameKey"
        :src
        :title="caption"
        :style="frameStyle"
        class="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
        loading="lazy"
        tabindex="-1"
      />
    </div>

    <figcaption class="text-xs text-muted">
      {{ caption }}
    </figcaption>
  </figure>
</template>
