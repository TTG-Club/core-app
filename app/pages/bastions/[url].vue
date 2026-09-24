<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '~bastions/model';

  import { BastionFacilityBody } from '~bastions/body';
  import {
    BASTION_API_PATH,
    BASTION_SECTION,
    BASTION_SEO,
    BASTION_WORKSHOP_PATH,
    getBastionFacilityMarkdown,
  } from '~bastions/model';
  import { PageActions } from '~ui/page';

  const route = useRoute();

  useSectionDetailRedirect(BASTION_SECTION);

  const { data: facility } = await useAsyncData(
    `bastion-${route.params.url}`,
    () =>
      $fetch<BastionFacilityDetailResponse>(
        `${BASTION_API_PATH}/${route.params.url}`,
      ),
  );

  const markdown = useEntityMarkdown(facility, getBastionFacilityMarkdown);

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (facility.value ? facility.value.source.name.rus : undefined),
    titleTemplate: BASTION_SEO.titleTemplate,
  });

  /**
   * Заголовок страницы для поисковиков.
   *
   * @returns Обрезанное название сооружения
   */
  function getSeoTitle(): string {
    if (!facility.value) {
      return '';
    }

    return getSlicedString(facility.value.name.rus, 36);
  }

  /**
   * Описание страницы для поисковиков.
   *
   * @returns Название, вид сооружения и редакция правил
   */
  function getSeoDescription(): string {
    if (!facility.value) {
      return '';
    }

    const category = facility.value.category?.name ?? 'сооружение бастиона';

    return getSlicedString(
      `${facility.value.name.rus} [${facility.value.name.eng}] — ${category} из D&D 5 (редакция 2024 года).`,
      160,
    );
  }

  const editUrl = computed(
    () => `${BASTION_WORKSHOP_PATH}/${route.params.url}`,
  );
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="facility?.name.rus"
    :subtitle="facility?.name.eng"
    :source="facility?.source"
    :date-time="facility?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        :close-url="{ name: BASTION_SECTION }"
        :markdown
      />
    </template>

    <template #default>
      <BastionFacilityBody
        v-if="facility"
        :facility
      />

      <template v-else>
        <USkeleton
          v-for="index in 3"
          :key="index"
          :class="`w-1/${index + 1} h-6`"
        />
      </template>
    </template>
  </NuxtLayout>
</template>
