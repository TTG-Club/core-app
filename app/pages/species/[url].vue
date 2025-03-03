<script setup lang="ts">
  import type { Specie } from '~/shared/types';
  import { getSlicedString } from '~/shared/utils';
  import {
    PageActions,
    PageContainer,
    PageHeader,
    UiGallery,
  } from '~/shared/ui';
  import { SpeciesRelatedDrawer, SpeciesBody } from '~/features/species';

  const {
    params: { url },
  } = useRoute();

  const {
    data: specie,
    error,
    refresh,
  } = await useAsyncData(`specie-${url}`, () =>
    $fetch<Specie>(`/api/v2/species/${url}`),
  );

  const seoTitle = computed(() => {
    if (!specie.value) {
      return '';
    }

    return getSlicedString(specie.value.name.rus, 28);
  });

  const seoDescription = computed(() => {
    if (!specie.value) {
      return '';
    }

    const type = specie.value.parent
      ? `происхождение вида ${specie.value.parent.name.rus}`
      : 'вид';

    return getSlicedString(
      `${specie.value.name.rus} (${specie.value.name.eng}) — ${type} D&D 5 2024 редакции. ${specie.value.description}`,
      200,
    );
  });

  useSeoMeta({
    title: () => seoTitle.value,
    description: () => seoDescription.value,
    ogImage: () => (specie.value ? specie.value.image : ''),
    author: () => (specie.value ? specie.value.source.name.rus : ''),
    titleTemplate: '%pageTitle %separator Виды и происхождения D&D 5 2024',
  });

  const showRelated = ref(false);

  const anchors = computed(() => {
    if (!specie.value?.features.length) {
      return [];
    }

    const list = [
      {
        key: 'specie-top',
        href: '#specie-base',
        title: 'Основная часть',
      },
    ];

    for (const feature of specie.value.features) {
      list.push({
        key: feature.url,
        href: `#${feature.url}`,
        title: feature.name.rus,
      });
    }

    return list;
  });
</script>

<template>
  <PageContainer id="specie-base">
    <PageHeader
      :title="specie?.name.rus"
      :subtitle="specie?.name.eng"
      :source="specie?.source"
      :date-time="specie?.updatedAt"
    >
      <template #actions>
        <PageActions @close="navigateTo('/species')" />
      </template>
    </PageHeader>

    <AFlex
      v-if="specie"
      :class="$style.specie"
      :gap="28"
    >
      <SpeciesBody
        :class="$style.right"
        :specie="specie"
      />

      <AFlex
        :class="$style.left"
        :gap="16"
        vertical
      >
        <UiGallery
          :preview="specie.image || '/img/no-img.webp'"
          :images="specie.gallery"
        />

        <AButton
          type="primary"
          @click.left.exact.prevent="showRelated = true"
        >
          Разновидности
        </AButton>

        <ClientOnly>
          <SpeciesRelatedDrawer
            v-model="showRelated"
            :url="specie.url"
          />
        </ClientOnly>

        <AAnchor
          :items="anchors"
          :offset-top="24"
          :bounds="24"
        />
      </AFlex>
    </AFlex>

    <AResult
      v-else
      :sub-title="error"
      status="error"
      title="Ошибка"
    >
      <template #extra>
        <AButton
          type="primary"
          @click.left.exact.prevent="refresh()"
        >
          Обновить
        </AButton>

        <AButton @click.left.exact.prevent="navigateTo('/species')">
          Вернуться в список
        </AButton>
      </template>
    </AResult>
  </PageContainer>
</template>

<style module lang="scss">
  .left {
    flex-shrink: 0;
    width: 288px;
  }

  .right {
    flex: 1 1 auto;
  }
</style>
