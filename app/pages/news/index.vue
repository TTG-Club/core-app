<script setup lang="ts">
  import { ArticleListing } from '~articles/listing';
  import { ARTICLE_TYPE } from '~articles/model';

  useSeoMeta({
    title: 'Новости',
    description: 'Новости проекта TTG Club по D&D 5.',
  });
</script>

<template>
  <ArticleListing
    :type="ARTICLE_TYPE.NEWS"
    title="Новости"
  />
</template>
