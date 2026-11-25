<script setup lang="ts">
  import type { LightGallerySettings } from 'lightgallery/lg-settings';

  import type { ImageFrame } from '~/shared/types';

  import lgFullscreen from 'lightgallery/plugins/fullscreen';
  import lgThumbnail from 'lightgallery/plugins/thumbnail';
  import lgZoom from 'lightgallery/plugins/zoom';
  import Lightgallery from 'lightgallery/vue';
  import { computed } from 'vue';

  import { getImageFrameStyle } from '~ui/image-frame';

  import { GALLERY_LABELS, GALLERY_OPENED_STATE_KEY } from './constants';

  const {
    preview,
    images = [],
    alt = '',
    disableSquare = false,
    previewFrame = undefined,
  } = defineProps<{
    preview: string;
    images?: Array<string>;
    alt?: string;
    disableSquare?: boolean;
    /**
     * Кадр обложки в квадрате превью. В самой галерее картинка открывается
     * целиком — кадр касается только превью.
     */
    previewFrame?: ImageFrame | null;
  }>();

  const {
    public: {
      lightGallery: { licenseKey },
    },
  } = useRuntimeConfig();

  const opened = useState<boolean>(GALLERY_OPENED_STATE_KEY, () => false);

  // Кадр имеет смысл только в квадрате: без него превью показывает картинку
  // целиком, и обрезать нечего.
  const previewFrameStyle = computed(() =>
    disableSquare ? undefined : getImageFrameStyle(previewFrame),
  );

  // Кадр — только у превью: остальные картинки в превью не видны, а в самой
  // галерее открываются целиком.
  const items = computed(() => {
    const previewItem = {
      src: preview,
      thumb: preview,
      alt,
      style: previewFrameStyle.value,
    };

    return [
      previewItem,
      ...images.map((image) => ({
        src: image,
        thumb: image,
        alt,
        style: undefined,
      })),
    ];
  });

  /** Есть ли что листать: подсказка с числом нужна, только когда картинок больше одной. */
  const hasMultipleItems = computed(() => items.value.length > 1);

  const settings = computed<LightGallerySettings>(() => ({
    licenseKey,
    speed: 500,
    plugins: [lgThumbnail, lgZoom, lgFullscreen],
    thumbnail: true,
    actualSize: false,
    showZoomInOutIcons: true,
    allowMediaOverlap: true,
    toggleThumb: true,
    mobileSettings: {
      controls: true,
      showCloseIcon: true,
      download: false,
    },
  }));
</script>

<template>
  <Lightgallery
    v-if="preview"
    :settings="settings"
    @before-open="opened = true"
    @after-close="opened = false"
  >
    <div
      v-for="(item, index) in items"
      :key="item.src"
      :data-src="item.src"
      :title="GALLERY_LABELS.zoom"
      :class="!!index ? 'hidden' : undefined"
      class="group relative cursor-zoom-in overflow-hidden rounded-lg"
    >
      <img
        class="block w-full rounded-lg object-cover"
        :class="!disableSquare ? 'aspect-square' : undefined"
        :style="item.style"
        :src="item.src"
        :alt="item.alt || undefined"
      />

      <!-- Подсказки поверх превью: не все догадываются, что картинка открывает галерею -->
      <template v-if="!index">
        <span
          v-if="hasMultipleItems"
          class="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-default/80 px-2 py-1 text-xs font-medium text-highlighted shadow-sm ring ring-default backdrop-blur-sm"
          aria-hidden="true"
        >
          <UIcon
            name="tabler:photo"
            class="size-4"
          />

          {{ items.length }}
        </span>

        <span
          class="pointer-events-none absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-default/80 text-highlighted shadow-sm ring ring-default backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"
          aria-hidden="true"
        >
          <UIcon
            name="tabler:zoom-in"
            class="size-4.5"
          />
        </span>
      </template>
    </div>
  </Lightgallery>
</template>
