<script setup lang="ts">
  import { SpeciesBody } from '~species/body';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import { UiGallery } from '~ui/gallery';
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';

  import type { NavigationMenuItem } from '#ui/components/NavigationMenu.vue';
  import type { SpeciesDetailResponse } from '~/shared/types';

  const {
    params: { url },
  } = useRoute();

  const overlay = useOverlay();

  const drawer = overlay.create(SpeciesLineagesDrawer, {
    destroyOnClose: true,
  });

  function openLineages(speciesUrl: string) {
    drawer.open({
      url: speciesUrl,
      onClose: () => drawer.close(),
    });
  }

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

  const anchors = computed<NavigationMenuItem[]>(() => {
    if (!species.value?.features?.length) {
      return [];
    }

    const list: NavigationMenuItem[] = [
      {
        to: '#species-base',
        label: 'Основная часть',
        type: 'link',
      },
    ];

    for (const feature of species.value.features) {
      list.push({
        to: `#${feature.url}`,
        label: feature.name.rus,
        type: 'link',
      });
    }

    return list;
  });
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
        @close="navigateTo('/species')"
      />
    </template>

    <template #default>
      <div
        v-if="species"
        :class="$style.species"
        class="flex gap-7"
      >
        <div
          :class="$style.left"
          class="flex flex-col gap-4"
        >
          <UiGallery
            :preview="species.image"
            :images="species.gallery"
          />

          <div :class="$style.stats">
            <div :class="$style.item">
              <span :class="$style.name">Тип:</span>

              <span :class="$style.value">
                {{ species.properties.type }}
              </span>
            </div>

            <div :class="$style.item">
              <span :class="$style.name">Размер:</span>

              <span :class="$style.value">
                {{ species.properties.size }}
              </span>
            </div>

            <div :class="$style.item">
              <span :class="$style.name">Скорость:</span>

              <span :class="$style.value">
                {{ species.properties.speed }}
              </span>
            </div>
          </div>

          <UButton
            v-if="species.hasLineages"
            block
            @click.left.exact.prevent="openLineages(species.url)"
          >
            Происхождения
          </UButton>

          <UNavigationMenu
            v-if="false"
            :class="$style.anchors"
            :items="anchors"
            orientation="vertical"
            variant="link"
          />
        </div>

        <SpeciesBody
          :class="$style.right"
          :species="species"
        />
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
    padding: 6px 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background: var(--color-bg-secondary);

    .item {
      display: flex;
      flex: 1 0 100%;
      gap: 0;

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
