<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';

  defineProps<Pick<SpellLinkResponse, 'ritual' | 'concentration'>>();
</script>

<template>
  <AFlex :gap="4">
    <ATag
      v-if="concentration"
      :style="{ margin: 0 }"
    >
      К
    </ATag>

    <ATag
      v-if="ritual"
      :style="{ margin: 0 }"
    >
      Р
    </ATag>
  </AFlex>
</template>
