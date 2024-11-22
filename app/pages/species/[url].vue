<script setup lang="ts">
  import type { Specie } from '~~/shared/types/character/species';
  import type { UseSeoMetaInput } from '@unhead/vue';

  const {
    params: { url },
  } = useRoute();

  const activeFeatures = ref<Array<string>>([]);

  const {
    data: specie,
    error,
    status,
    refresh,
  } = await useProxy<Specie>(`/species/${url}`);

  watch(
    specie,
    (value) => {
      if (!value) {
        return;
      }

      activeFeatures.value = value.features.map((feature) => feature.url);
    },
    {
      immediate: true,
    },
  );

  const getSeoMeta = (): UseSeoMetaInput => {
    if (!specie.value) {
      return {};
    }

    return {
      title: `${specie.value.name.rus} (${specie.value.name.eng})`,
      description:
        `${specie.value.name.rus} (${specie.value.name.eng}) - вид персонажа по D&D 2024 редакции. ${specie.value.description || ''}`.trim(),
      author: specie.value.source.name.rus,
    };
  };

  useSeoMeta(getSeoMeta());

  const showRelated = ref(false);

  const speed = computed(() => {
    if (!specie.value) {
      return '';
    }

    const acc = [`${specie.value.properties.speed.base} фт.`];

    if (specie.value.properties.speed.climb) {
      acc.push(`лазая ${specie.value.properties.speed.climb} фт.`);
    }

    if (specie.value.properties.speed.swim) {
      acc.push(`плавая ${specie.value.properties.speed.swim} фт.`);
    }

    if (specie.value.properties.speed.fly) {
      acc.push(`летая ${specie.value.properties.speed.fly} фт.`);
    }

    return acc.join(', ');
  });

  const darkVision = computed(() =>
    specie.value?.properties.darkVision
      ? `${specie.value.properties.darkVision} фт.`
      : '',
  );

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
  <ASpin
    data-allow-mismatch
    size="large"
    :spinning="status === 'pending'"
  >
    <div
      v-if="specie"
      id="specie-base"
      :class="$style.specie"
    >
      <AFlex
        vertical
        :gap="24"
      >
        <DetailHeader
          :title="specie.name.rus"
          :subtitle="specie.name.eng"
          :source="specie.source"
          :date-time="specie.updatedAt"
          @close="navigateTo('/species')"
        />

        <AFlex :gap="28">
          <AFlex
            :gap="16"
            :class="$style.left"
            vertical
          >
            <ImageGallery
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
              <CharacterSpeciesRelated
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

          <AFlex
            :gap="16"
            :class="$style.right"
            vertical
          >
            <div :class="$style.stats">
              <div :class="$style.stat">
                <ATooltip title="Тип существа">
                  <ATypographyTitle
                    :level="5"
                    :class="$style.title"
                    content="ТИП"
                  />
                </ATooltip>

                <ATypographyText
                  :class="$style.value"
                  :content="specie.properties.type"
                />
              </div>

              <div :class="$style.stat">
                <ATooltip title="Размер">
                  <ATypographyTitle
                    :level="5"
                    :class="$style.title"
                    content="РАЗ"
                  />
                </ATooltip>

                <ATypographyText
                  :class="$style.value"
                  :content="specie.properties.size"
                />
              </div>

              <div :class="$style.stat">
                <ATooltip title="Скорость">
                  <ATypographyTitle
                    :level="5"
                    :class="$style.title"
                    content="СКР"
                  />
                </ATooltip>

                <ATypographyText
                  :class="$style.value"
                  :content="speed"
                />
              </div>

              <div
                v-if="darkVision"
                :class="$style.stat"
              >
                <ATooltip title="Темное зрение">
                  <ATypographyTitle
                    :level="5"
                    :class="$style.title"
                    content="ТЗ"
                  />
                </ATooltip>

                <ATypographyText
                  :class="$style.value"
                  :content="darkVision"
                />
              </div>
            </div>

            <ATypographyText
              v-if="specie.description"
              :content="specie.description"
            />

            <ACollapse
              v-if="specie.features.length"
              v-model:active-key="activeFeatures"
              ghost
            >
              <ACollapsePanel
                v-for="feature in specie.features"
                :id="feature.url"
                :key="feature.url"
                data-allow-mismatch
              >
                <template #header>
                  <ATypographyTitle :level="4">
                    {{ feature.name.rus }}
                  </ATypographyTitle>
                </template>

                <template #default>
                  {{ feature.description }}
                </template>
              </ACollapsePanel>
            </ACollapse>
          </AFlex>
        </AFlex>
      </AFlex>
    </div>

    <AResult
      v-else
      status="error"
      title="Ошибка"
      :sub-title="error"
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
  </ASpin>
</template>

<style module lang="scss">
  .specie {
    position: relative;
  }

  .left {
    flex-shrink: 0;
    width: 288px;
  }

  .right {
    flex: 1 1 auto;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(108px, 1fr));
    gap: 8px;
  }

  .stat {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    text-align: center;

    background-color: var(--color-hover);
    border-radius: 8px;

    .title {
      flex-shrink: 0;
      padding: 4px 0;
      background-color: var(--color-hover);
    }

    .value {
      display: flex;
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;

      min-height: 48px;
      padding: 4px;
    }
  }
</style>
