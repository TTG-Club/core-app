<script setup lang="ts">
  import {
    VTTG_LANDING_PATH,
    VTTG_PASSWORD_RESET_INTRO,
    VTTG_PASSWORD_RESET_PAGE,
    VTTG_PASSWORD_RESET_SAFETY,
    VTTG_PASSWORD_RESET_SEO,
    VTTG_PASSWORD_RESET_TROUBLESHOOTING,
    VTTG_PASSWORD_RESET_VARIANTS_TITLE,
    VTTG_PASSWORD_RESET_VISIBLE_VARIANTS,
    VTTG_SUPPORT_LINK,
  } from '~vttg/model';
  import { VttgGuideSteps } from '~vttg/ui';

  useSeoMeta({
    title: VTTG_PASSWORD_RESET_SEO.title,
    description: VTTG_PASSWORD_RESET_SEO.description,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_PASSWORD_RESET_PAGE.title"
    :subtitle="VTTG_PASSWORD_RESET_PAGE.subtitle"
    :back-to="VTTG_LANDING_PATH"
  >
    <template #default>
      <div class="flex min-w-0 flex-col gap-8">
        <div class="flex flex-col gap-3">
          <p
            v-for="paragraph in VTTG_PASSWORD_RESET_INTRO"
            :key="paragraph"
            class="text-sm leading-6 text-toned"
          >
            {{ paragraph }}
          </p>

          <UAlert
            :title="VTTG_PASSWORD_RESET_SAFETY.title"
            :description="VTTG_PASSWORD_RESET_SAFETY.description"
            :icon="VTTG_PASSWORD_RESET_SAFETY.icon"
            color="success"
            variant="subtle"
          />
        </div>

        <section class="flex flex-col gap-4">
          <h2 class="text-lg font-medium text-highlighted">
            {{ VTTG_PASSWORD_RESET_VARIANTS_TITLE }}
          </h2>

          <!--
            Неактивные вкладки остаются в разметке: инструкцию целиком видит поиск.
            На узком экране подписи не сокращаются — ряд прокручивается вбок.
          -->
          <UTabs
            :items="VTTG_PASSWORD_RESET_VISIBLE_VARIANTS"
            :unmount-on-hide="false"
            :ui="{
              list: 'hidden-scrollbar overflow-x-auto',
              trigger: 'shrink-0',
              content: 'pt-4',
            }"
          >
            <template #content="{ item: variant }">
              <div class="flex flex-col gap-6">
                <p class="text-sm leading-6 text-muted">
                  {{ variant.description }}
                </p>

                <VttgGuideSteps :steps="variant.steps" />
              </div>
            </template>
          </UTabs>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <UIcon
              :name="VTTG_PASSWORD_RESET_TROUBLESHOOTING.icon"
              class="size-5 shrink-0 text-primary"
            />

            <h2 class="text-lg font-medium text-highlighted">
              {{ VTTG_PASSWORD_RESET_TROUBLESHOOTING.title }}
            </h2>
          </div>

          <ul class="flex list-disc flex-col gap-2 pl-5">
            <li
              v-for="problem in VTTG_PASSWORD_RESET_TROUBLESHOOTING.problems"
              :key="problem"
              class="text-sm leading-6 text-toned marker:text-dimmed"
            >
              {{ problem }}
            </li>
          </ul>

          <div
            v-if="VTTG_SUPPORT_LINK"
            class="flex flex-wrap items-center gap-3"
          >
            <p class="text-sm leading-6 text-toned">
              {{ VTTG_PASSWORD_RESET_TROUBLESHOOTING.supportText }}
            </p>

            <UButton
              :label="VTTG_PASSWORD_RESET_TROUBLESHOOTING.supportLabel"
              :icon="VTTG_SUPPORT_LINK.icon"
              :to="VTTG_SUPPORT_LINK.url"
              target="_blank"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </div>
        </section>
      </div>
    </template>
  </NuxtLayout>
</template>
