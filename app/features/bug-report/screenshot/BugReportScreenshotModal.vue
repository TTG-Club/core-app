<script setup lang="ts">
  import {
    SCREENSHOT_MODAL_FIT_LABEL,
    SCREENSHOT_MODAL_UI,
    SCREENSHOT_MODAL_ZOOM_LABEL,
    SCREENSHOT_ORIGINAL_LINK_LABEL,
  } from '../model';

  /**
   * Окно просмотра скриншота баг-репорта: общее для админки и «Моих
   * багрепортов», чтобы снимок в обоих местах открывался одинаково.
   *
   * Снимок приходит в разрешении экрана того, кто его прислал (бывает и 4K), а
   * окно вписывает его в экран целиком. Чтобы разглядеть мелочи, по щелчку
   * снимок переключается в свой настоящий размер, а рамка уезжает в прокрутку.
   */
  const props = defineProps<{
    /** Адрес файла скриншота. */
    url: string;

    /** Заголовок окна. */
    title: string;

    /** Подпись картинки для скринридера. */
    alt: string;
  }>();

  const isOpen = defineModel<boolean>('open', { required: true });

  // Настоящий размер снимка: по щелчку вместо вписанного в экран.
  const isZoomed = ref(false);

  /** Рамка: в настоящем размере снимок не влезает, поэтому нужна прокрутка. */
  const frameClass = computed(() =>
    isZoomed.value
      ? 'flex justify-start overflow-auto rounded-lg bg-black/10 p-2'
      : 'flex items-center justify-center overflow-hidden rounded-lg bg-black/10 p-2',
  );

  /**
   * Картинка: вписанная в экран не растягивается сверх своего разрешения (от
   * растяжения снимок стал бы мыльным), а в настоящем размере не ужимается
   * вовсе. Из высоты вычтены шапка окна и отбивки, иначе окно уезжает в
   * прокрутку целиком.
   */
  const imageClass = computed(() =>
    isZoomed.value
      ? 'max-w-none cursor-zoom-out'
      : 'max-h-[calc(100dvh-13rem)] max-w-full cursor-zoom-in object-contain',
  );

  /** Подпись переключателя: она же объясняет, что будет по щелчку. */
  const zoomLabel = computed(() =>
    isZoomed.value ? SCREENSHOT_MODAL_FIT_LABEL : SCREENSHOT_MODAL_ZOOM_LABEL,
  );

  /** Переключение между «вписать в экран» и настоящим размером снимка. */
  function toggleZoom() {
    isZoomed.value = !isZoomed.value;
  }

  // Закрытое окно забывает увеличение: открывать снимок всегда лучше целиком.
  watch(isOpen, (open) => {
    if (!open) {
      isZoomed.value = false;
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="SCREENSHOT_MODAL_UI"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <div :class="frameClass">
          <img
            :src="props.url"
            :alt="alt"
            :class="imageClass"
            @click.left.exact.prevent="toggleZoom"
          />
        </div>

        <div class="flex items-center justify-end gap-4 text-xs text-muted">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1 hover:text-primary"
            @click.left.exact.prevent="toggleZoom"
          >
            <UIcon
              :name="isZoomed ? 'tabler:zoom-scan' : 'tabler:zoom-in'"
              class="size-3.5 shrink-0"
            />

            <span>{{ zoomLabel }}</span>
          </button>

          <a
            :href="props.url"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-1 hover:text-primary"
          >
            <span>{{ SCREENSHOT_ORIGINAL_LINK_LABEL }}</span>

            <UIcon
              name="tabler:external-link"
              class="size-3.5 shrink-0"
            />
          </a>
        </div>
      </div>
    </template>
  </UModal>
</template>
