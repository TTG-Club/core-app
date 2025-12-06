<script setup lang="ts">
  import type { RoadmapItem } from '~roadmap/types';
  import { RoadmapDetail } from '~roadmap/detail';
  import { RatingWidget } from '~ui/rating';

  const { feature } = defineProps<{
    feature: RoadmapItem;
  }>();

  const overlay = useOverlay();

  const preview = overlay.create(RoadmapDetail, {
    props: { feature },
  });
</script>

<template>
  <div
    class="flex cursor-pointer gap-4 rounded-xl bg-elevated p-2 transition-colors hover:bg-accented"
    @click.left.exact.prevent="preview.open()"
  >
    <div class="flex min-w-0 flex-auto flex-col">
      <div class="line-clamp-1 text-base font-bold">
        {{ feature.name }}
      </div>

      <div class="line-clamp-4">
        {{ feature.preview || 'Краткое описание не добавлено' }}
      </div>
    </div>

    <RatingWidget
      section="ROADMAP"
      :url="feature.url"
      :initial="feature.rating"
    />
  </div>
</template>
