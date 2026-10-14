<script setup lang="ts">
  import { VTTG_SEO } from '~vttg/model';
  import { VttgLanding } from '~vttg/ui';

  definePageMeta({
    layout: 'vttg',
  });

  const seoImageUrl = computed(() => getSeoImageUrl(VTTG_SEO.image.url));

  useSeoMeta({
    title: VTTG_SEO.title,
    description: VTTG_SEO.description,
    ogImage: seoImageUrl,
    ogImageWidth: VTTG_SEO.image.size,
    ogImageHeight: VTTG_SEO.image.size,
    ogImageAlt: VTTG_SEO.image.alt,
    twitterImage: seoImageUrl,
    twitterImageAlt: VTTG_SEO.image.alt,
    // Логотип квадратный — широкая карточка его бы обрезала.
    twitterCard: 'summary',
  });

  // Главная картинка страницы в структурированных данных — её Google
  // предпочитает случайным картинкам из разметки.
  useSchemaOrg([
    defineWebPage({
      primaryImageOfPage: {
        url: seoImageUrl,
        width: VTTG_SEO.image.size,
        height: VTTG_SEO.image.size,
        caption: VTTG_SEO.image.alt,
      },
    }),
  ]);
</script>

<template>
  <NuxtLayout>
    <VttgLanding />
  </NuxtLayout>
</template>
