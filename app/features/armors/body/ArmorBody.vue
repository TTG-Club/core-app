<script setup lang="ts">
  import { DescriptionsBlock, TopBar } from './ui';

  import type { ArmorDetailResponse } from '~/features/armors/types';
  import { UiGallery } from '~ui/gallery';
  import StatsBlock from '~armors/body/ui/StatsBlock.vue';

  defineProps<{
    armor: ArmorDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="flex w-full flex-col gap-3 @min-[800px]:max-w-80">
        <TopBar :types="armor.subtitle" />

        <StatsBlock
          :cost="armor.cost"
          :weight="armor.weight"
          :armor-category="armor.armorCategory"
          :armor-class="armor.armorClass"
          :strength="armor.strength"
          :stealth="armor.stealth"
        />

        <div class="max-w-40 overflow-hidden rounded-md border border-default">
          <UiGallery :preview="armor.image || '/img/no-img.webp'" />
        </div>
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="armor.description" />
      </div>
    </div>
  </div>
</template>
