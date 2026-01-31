<script setup lang="ts">
  import { RoadmapDetail } from '~roadmap/detail';
  import { RatingWidget } from '~ui/rating';

  import type { RoadmapItem } from '~roadmap/types';

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
    :class="[
      'flex cursor-pointer flex-col gap-2 rounded-xl p-4',
      'bg-elevated transition-colors hover:bg-accented',
    ]"
    @click.left.exact.prevent="preview.open()"
  >
    <div class="min-w-0">
      <RatingWidget
        class="float-right clear-right align-text-top"
        section="ROADMAP"
        :url="feature.url"
        :initial="feature.rating"
        size="small"
      />

      <span class="line-clamp-2 inline text-base leading-5 font-bold">
        {{ feature.name }}
      </span>
    </div>

    <div class="line-clamp-4">
      {{ feature.preview || 'Краткое описание не добавлено' }}
    </div>
  </div>
</template>
