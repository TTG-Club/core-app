<script setup lang="ts">
  import { Role } from '~/shared/types';
  import {
    VTTG_SUBSCRIPTION_CTA,
    VTTG_SUBSCRIPTION_FAQ_HEADING,
    VTTG_SUBSCRIPTION_FAQ_ITEMS,
    VTTG_SUBSCRIPTION_SEO,
  } from '~vttg/model';
  import {
    VttgFaqSection,
    VttgSubscriptionHero,
    VttgSubscriptionPerks,
  } from '~vttg/ui';

  // Пока оплата не подключена, страницу видят только администраторы.
  definePageMeta({
    layout: 'vttg',
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: VTTG_SUBSCRIPTION_SEO.title,
    description: VTTG_SUBSCRIPTION_SEO.description,
    robots: VTTG_SUBSCRIPTION_SEO.robots,
  });
</script>

<template>
  <NuxtLayout>
    <UPage>
      <VttgSubscriptionHero />

      <VttgSubscriptionPerks />

      <VttgFaqSection
        :heading="VTTG_SUBSCRIPTION_FAQ_HEADING"
        :items="VTTG_SUBSCRIPTION_FAQ_ITEMS"
      />

      <section class="mx-auto max-w-330 px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <UPageCTA
          :title="VTTG_SUBSCRIPTION_CTA.title"
          :description="VTTG_SUBSCRIPTION_CTA.description"
          :links="VTTG_SUBSCRIPTION_CTA.links"
          variant="subtle"
        />
      </section>
    </UPage>
  </NuxtLayout>
</template>
