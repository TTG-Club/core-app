<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      preview: string;
      images?: Array<string>;
      alt?: string;
    }>(),
    {
      images: () => [],
      alt: '',
    },
  );

  const visible = defineModel<boolean>({ default: false });

  const gallery = computed(() => {
    if (!props.images.length) {
      return [props.preview];
    }

    return props.images;
  });
</script>

<template>
  <div :class="$style.gallery">
    <AImage
      :preview="{ visible: false }"
      :src="preview"
      :alt
      fallback="/img/no-img.webp"
      @click.left.exact.prevent="visible = !!gallery.length"
    />
  </div>

  <ClientOnly>
    <div
      v-if="gallery.length"
      v-show="false"
    >
      <AImagePreviewGroup
        :preview="{
          visible,
          onVisibleChange: (vis) => (visible = vis),
        }"
      >
        <AImage
          v-for="image in gallery"
          :key="image"
          :src="image"
          fallback="/img/no-img.webp"
        />
      </AImagePreviewGroup>
    </div>
  </ClientOnly>
</template>

<style module>
  .gallery {
    overflow: hidden;
    width: 100%;
    background-color: var(--color-hover);
    border-radius: 8px;
  }
</style>
