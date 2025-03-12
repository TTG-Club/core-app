<script setup lang="ts">
  import { SmallLink } from '../link';
</script>

<template>
  <SmallLink>
    <template #icon>
      <ASkeleton
        :title="false"
        :paragraph="false"
        :avatar="{ size: 16 }"
        active
      />
    </template>

    <template #default>
      <ASkeleton
        :title="false"
        :avatar="false"
        :paragraph="{ rows: 1, width: '100%' }"
        active
      />
    </template>

    <template #caption>
      <ASkeleton
        :title="false"
        :avatar="false"
        :paragraph="{ rows: 1, width: '75%' }"
        active
      />
    </template>
  </SmallLink>
</template>
