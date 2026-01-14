<script setup lang="ts">
  import { SpeciesBody } from '~species/body';
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const {
    params: { url },
  } = useRoute();

  const {
    data: species,
    error,
    refresh,
  } = await useAsyncData(`species-${url}`, () =>
    $fetch<SpeciesDetailResponse>(`/api/v2/species/${url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    // ogImage: () => getSeoImageUrl(species.value?.image),
    author: () => (species.value ? species.value.source.name.rus : undefined),
    titleTemplate: '%s | Виды и происхождения D&D 5 2024',
  });

  function getSeoTitle() {
    if (!species.value) {
      return '';
    }

    return getSlicedString(species.value.name.rus, 26);
  }

  function getSeoDescription() {
    if (!species.value) {
      return '';
    }

    const type = species.value.parent
      ? `происхождение вида ${species.value.parent.name.rus}`
      : 'вид';

    return getSlicedString(
      `${species.value.name.rus} [${species.value.name.eng}] — ${type} из D&D 5 (редакция 2024 года).`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/species/${url}`);
</script>

<template>
  <NuxtLayout
    id="species-base"
    name="detail"
    :title="species?.name.rus"
    :subtitle="species?.name.eng"
    :source="species?.source"
    :date-time="species?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        :close-url="{ name: 'species' }"
      />
    </template>

    <template #default>
      <div v-if="species">
        <SpeciesBody :species="species" />
      </div>

      <UiResult
        v-else
        :error
        status="error"
        title="Ошибка"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="refresh()"> Обновить </UButton>

          <UButton
            variant="ghost"
            @click.left.exact.prevent="navigateTo('/species')"
          >
            Вернуться в список
          </UButton>
        </template>
      </UiResult>
    </template>
  </NuxtLayout>
</template>
