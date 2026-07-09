<script setup lang="ts">
  import { ArticleListing } from '~articles/listing';
  import { ARTICLE_TYPE } from '~articles/model';

  useSeoMeta({
    title: 'Статьи',
    description: 'Статьи проекта TTG Club по D&D 5.',
  });
</script>

<template>
  <ArticleListing
    :type="ARTICLE_TYPE.ARTICLE"
    title="Статьи"
  />
</template>
