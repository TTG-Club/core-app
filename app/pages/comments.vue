<script setup lang="ts">
  import {
    RECENT_COMMENTS_DESCRIPTION,
    RECENT_COMMENTS_TITLE,
  } from '~comments/model';
  import { RecentComments } from '~comments/recent';

  useSeoMeta({
    title: RECENT_COMMENTS_TITLE,
    description: RECENT_COMMENTS_DESCRIPTION,
    ogTitle: `${RECENT_COMMENTS_TITLE} | TTG Club Онлайн-справочник`,
  });
</script>

<template>
  <RecentComments />
</template>
