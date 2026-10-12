<script setup lang="ts">
  import { useSubscriptionPaymentResult } from '~vttg/composables';
  import {
    VTTG_SUBSCRIPTION_CTA,
    VTTG_SUBSCRIPTION_FAQ_HEADING,
    VTTG_SUBSCRIPTION_FAQ_ITEMS,
    VTTG_SUBSCRIPTION_SEO,
  } from '~vttg/model';
  import {
    VttgFaqSection,
    VttgSubscribeButton,
    VttgSubscriptionHero,
    VttgSubscriptionPerks,
  } from '~vttg/ui';

  definePageMeta({
    layout: 'vttg',
  });

  useSubscriptionPaymentResult();

  useSeoMeta({
    title: VTTG_SUBSCRIPTION_SEO.title,
    description: VTTG_SUBSCRIPTION_SEO.description,
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
          variant="subtle"
        >
          <template #links>
            <VttgSubscribeButton :soon="VTTG_SUBSCRIPTION_CTA.soonButton" />

            <UButton v-bind="VTTG_SUBSCRIPTION_CTA.landingLink" />
          </template>
        </UPageCTA>
      </section>
    </UPage>
  </NuxtLayout>
</template>
