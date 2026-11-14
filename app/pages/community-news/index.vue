<script setup lang="ts">
  import { CommunityNewsListing } from '~community-news/listing';
  import {
    COMMUNITY_NEWS_SEO_DESCRIPTION,
    COMMUNITY_NEWS_TITLE,
  } from '~community-news/model';

  useSeoMeta({
    title: COMMUNITY_NEWS_TITLE,
    description: COMMUNITY_NEWS_SEO_DESCRIPTION,
  });
</script>

<template>
  <CommunityNewsListing />
</template>
