<script setup lang="ts">
  import { computed } from 'vue';
  import Lightgallery from 'lightgallery/vue';
  import lgThumbnail from 'lightgallery/plugins/thumbnail';
  import lgZoom from 'lightgallery/plugins/zoom';
  import lgFullscreen from 'lightgallery/plugins/fullscreen';
  import type { LightGallerySettings } from 'lightgallery/lg-settings';

  const {
    preview,
    images = [],
    alt = '',
    disableSquare = false,
  } = defineProps<{
    preview: string;
    images?: Array<string>;
    alt?: string;
    disableSquare?: boolean;
  }>();

  const {
    public: {
      lightGallery: { licenseKey },
    },
  } = useRuntimeConfig();

  const opened = useState<boolean>('ui-gallery-opened', () => false);

  const items = computed(() => {
    if (!images.length) {
      return [{ src: preview, thumb: preview, alt }];
    }

    return [
      { src: preview, thumb: preview, alt },
      ...images.map((img) => ({ src: img, thumb: img, alt })),
    ];
  });

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
      :class="!!index ? 'hidden' : undefined"
      class="cursor-zoom-in"
    >
      <img
        class="w-full rounded-lg object-cover"
        :class="!disableSquare ? 'aspect-square' : undefined"
        :src="item.src"
        :alt="item.alt || undefined"
      />
    </div>
  </Lightgallery>
</template>
