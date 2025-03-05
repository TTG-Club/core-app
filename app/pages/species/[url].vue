<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import {
    PageActions,
    PageContainer,
    PageHeader,
    UiGallery,
  } from '~/shared/ui';
  import { SpeciesBody, SpeciesLineagesDrawer } from '~/features/species';
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

  const seoTitle = computed(() => {
    if (!species.value) {
      return '';
    }

    return getSlicedString(species.value.name.rus, 28);
  });

  const seoDescription = computed(() => {
    if (!species.value) {
      return '';
    }

    const type = species.value.parent
      ? `происхождение вида ${species.value.parent.name.rus}`
      : 'вид';

    return getSlicedString(
      `${species.value.name.rus} (${species.value.name.eng}) — ${type} D&D 5 2024 редакции. ${species.value.description}`,
      200,
    );
  });

  useSeoMeta({
    title: () => seoTitle.value,
    description: () => seoDescription.value,
    ogImage: () => (species.value ? species.value.image : ''),
    author: () => (species.value ? species.value.source.name.rus : ''),
    titleTemplate: '%pageTitle %separator Виды и происхождения D&D 5 2024',
  });

  const showRelated = ref(false);

  const anchors = computed(() => {
    if (!species.value?.features.length) {
      return [];
    }

    const list = [
      {
        key: 'species-top',
        href: '#species-base',
        title: 'Основная часть',
      },
    ];

    for (const feature of species.value.features) {
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
  <PageContainer id="species-base">
    <PageHeader
      :title="species?.name.rus"
      :subtitle="species?.name.eng"
      :source="species?.source"
      :date-time="species?.updatedAt"
    >
      <template #actions>
        <PageActions @close="navigateTo('/species')" />
      </template>
    </PageHeader>

    <AFlex
      v-if="species"
      :class="$style.species"
      :gap="28"
    >
      <AFlex
        :class="$style.left"
        :gap="16"
        vertical
      >
        <div :class="$style.galleryImg">
          <UiGallery
            :preview="species.image || '/img/no-img.webp'"
            :images="species.gallery"
          />

          <div :class="$style.stats">
            <ADivider
              orientation="left"
              :style="{ marginBottom: '4px' }"
              :orientation-margin="16"
            >
              Особенности
            </ADivider>

            <div :class="$style.item">
              <p>Тип:</p>

              <ATypographyText
                :class="$style.value"
                :content="species.properties.type"
              />
            </div>

            <div :class="$style.item">
              <p>Размер:</p>

              <ATypographyText
                :class="$style.value"
                :content="species.properties.size"
              />
            </div>

            <div :class="$style.item">
              <p>Скорость:</p>

              <ATypographyText
                :class="$style.value"
                :content="species.properties.speed"
              />
            </div>
          </div>
        </div>

        <AButton
          v-if="species.hasLineages"
          type="primary"
          @click.left.exact.prevent="showRelated = true"
        >
          Происхождения
        </AButton>

        <ClientOnly>
          <SpeciesLineagesDrawer
            v-if="species.hasLineages"
            v-model="showRelated"
            :url="species.url"
          />
        </ClientOnly>

        <AAnchor
          :items="anchors"
          :offset-top="24"
          :bounds="24"
        />
      </AFlex>

      <SpeciesBody
        :class="$style.right"
        :species="species"
      />
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
    width: 100%;
    min-width: 288px;
    max-width: 320px;
  }

  .right {
    flex: 1 1 auto;
  }

  .galleryImg {
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .stats {
    overflow: hidden;
    min-width: 288px;
    padding: 0 0 4px 0;
    background: var(--color-bg-secondary);

    .item {
      display: flex;
      padding: 6px 16px;

      p {
        min-width: 80px;
        margin-bottom: 0;

        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
