<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';

  defineProps<Pick<SpellLinkResponse, 'ritual' | 'concentration'>>();
</script>

<template>
  <AFlex :gap="4">
    <ATooltip
      v-if="concentration"
      :mouse-enter-delay="0.7"
      title="Концентрация"
      destroy-tooltip-on-hide
    >
      <ATag :style="{ margin: 0 }">К</ATag>
    </ATooltip>

    <ATooltip
      v-if="ritual"
      :mouse-enter-delay="0.7"
      title="Ритуал"
      destroy-tooltip-on-hide
    >
      <ATag :style="{ margin: 0 }">Р</ATag>
    </ATooltip>
  </AFlex>
</template>
