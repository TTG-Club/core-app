<script setup lang="ts">
  import type { FeatLinkResponse } from '~/shared/types';

  defineProps<Pick<FeatLinkResponse, 'category'>>();
</script>

<template>
  <AFlex :gap="4">
    <ATag
      v-if="category"
      :style="{ margin: 0 }"
    >
      {category}
    </ATag>
  </AFlex>
</template>
