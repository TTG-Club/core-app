<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { getSlicedString } from '~/shared/utils';
  import { SpeciesBody } from '~species/body';
  import { UiGallery } from '~ui/gallery';
  import { PageActions, PageContainer, PageHeader } from '~ui/page';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const {
    params: { url },
  } = useRoute();

  const { open: openLineages } = useDrawer('species-lineages');

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
    ogImage: () => (species.value ? species.value.image : undefined),
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
      `${species.value.name.rus} [${species.value.name.eng}] — ${type} D&D 5 2024 редакции. ${species.value.description}`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/species/${url}`);

  const anchors = computed(() => {
    if (!species.value?.features?.length) {
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

  function handleAnchorClick(e: Event, { href }: { href: string }) {
    navigateTo({
      hash: href,
      replace: true,
    });
  }
</script>

<template>
  <PageContainer id="species-base">
    <template #header>
      <PageHeader
        :title="species?.name.rus"
        :subtitle="species?.name.eng"
        :source="species?.source"
        :date-time="species?.updatedAt"
        copy-title
      >
        <template #actions>
          <PageActions
            :edit-url="editUrl"
            @close="navigateTo('/species')"
          />
        </template>
      </PageHeader>
    </template>

    <template #default>
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
          </div>

          <div :class="$style.stats">
            <ADivider
              orientation="left"
              :style="{ marginBottom: '4px' }"
              :orientation-margin="16"
            >
              Особенности
            </ADivider>

            <div :class="$style.item">
              <span :class="$style.name">Тип:</span>

              <ATypographyText
                :class="$style.value"
                :content="species.properties.type"
              />
            </div>

            <div :class="$style.item">
              <span :class="$style.name">Размер:</span>

              <ATypographyText
                :class="$style.value"
                :content="species.properties.size"
              />
            </div>

            <div :class="$style.item">
              <span :class="$style.name">Скорость:</span>

              <ATypographyText
                :class="$style.value"
                :content="species.properties.speed"
              />
            </div>
          </div>

          <AButton
            v-if="species.hasLineages"
            type="primary"
            @click.left.exact.prevent="openLineages(species.url)"
          >
            Происхождения
          </AButton>

          <AAnchor
            :items="anchors"
            :offset-top="24"
            :bounds="24"
            :class="$style.anchors"
            @click.left.exact.prevent="handleAnchorClick"
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
    </template>
  </PageContainer>
</template>

<style module lang="scss">
  .species {
    flex-direction: column;

    @include media-min($md) {
      flex-direction: row;
    }
  }
  .left {
    flex-shrink: 0;
    align-items: center;
    width: 100%;
    max-width: 100%;

    @include media-min($md) {
      align-items: normal;
      max-width: 320px;
    }
  }

  .right {
    flex: 1 1 auto;
  }

  .galleryImg {
    overflow: hidden;
    max-width: 160px;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    @include media-min($md) {
      max-width: 100%;
    }
  }

  .anchors {
    display: none;

    @include media-min($md) {
      display: block;
    }
  }

  .stats {
    overflow: hidden;

    width: 100%;
    padding: 0 0 4px 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background: var(--color-bg-secondary);

    .item {
      display: flex;
      flex: 1 0 100%;
      gap: 4px;

      min-width: 100%;
      padding: 6px 16px;

      @include media-min($sm) {
        display: flex;
      }

      .name {
        min-width: 80px;
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
