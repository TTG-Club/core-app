<script setup lang="ts">
  import {
    VTTG_SUBSCRIPTION_PERK_GROUPS,
    VTTG_SUBSCRIPTION_PERKS_HEADING,
    VTTG_SUBSCRIPTION_PERKS_SECTION_ID,
  } from '../model';
  import VttgSectionHeading from './VttgSectionHeading.vue';
  import VttgSubscriptionLimitComparison from './VttgSubscriptionLimitComparison.vue';
</script>

<template>
  <section
    :id="VTTG_SUBSCRIPTION_PERKS_SECTION_ID"
    class="py-16 md:py-20"
  >
    <div class="mx-auto max-w-330 px-4 sm:px-6 lg:px-8">
      <VttgSectionHeading
        :title="VTTG_SUBSCRIPTION_PERKS_HEADING.title"
        :subtitle="VTTG_SUBSCRIPTION_PERKS_HEADING.subtitle"
      />

      <div class="flex flex-col gap-12 lg:gap-16">
        <!-- На широком экране подпись группы стоит слева от карточек, на узком — над ними. -->
        <div
          v-for="group in VTTG_SUBSCRIPTION_PERK_GROUPS"
          :key="group.title"
          class="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10"
        >
          <div
            class="flex items-center gap-4 lg:flex-col lg:items-start lg:self-start"
          >
            <span
              class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring ring-primary/30 lg:size-14"
            >
              <UIcon
                :name="group.icon"
                class="size-6 text-primary lg:size-7"
              />
            </span>

            <div class="flex min-w-0 flex-col gap-1">
              <h3 class="text-xl font-bold text-highlighted md:text-2xl">
                {{ group.title }}
              </h3>

              <p class="text-sm leading-relaxed text-muted md:text-base">
                {{ group.description }}
              </p>
            </div>
          </div>

          <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
            <li
              v-for="perk in group.perks"
              :key="perk.title"
            >
              <UPageCard
                :icon="perk.icon"
                :title="perk.title"
                :description="perk.description"
                variant="subtle"
                spotlight
                spotlight-color="primary"
                class="h-full"
                :ui="{
                  leading:
                    'mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10',
                  leadingIcon: 'size-6',
                  title: 'text-base md:text-lg',
                  description: 'leading-relaxed',
                  footer: 'w-full',
                }"
              >
                <template
                  v-if="perk.limit"
                  #footer
                >
                  <VttgSubscriptionLimitComparison :limit="perk.limit" />
                </template>
              </UPageCard>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
