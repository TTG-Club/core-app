<script setup lang="ts">
  import type { Specie } from '~/shared/types';

  const { specie } = defineProps<{
    specie: Specie;
  }>();

  const speed = computed(() => {
    if (!specie) {
      return '';
    }

    const acc = [`${specie.properties.speed.base} фт.`];

    if (specie.properties.speed.climb) {
      acc.push(`лазая ${specie.properties.speed.climb} фт.`);
    }

    if (specie.properties.speed.swim) {
      acc.push(`плавая ${specie.properties.speed.swim} фт.`);
    }

    if (specie.properties.speed.fly) {
      acc.push(`летая ${specie.properties.speed.fly} фт.`);
    }

    return acc.join(', ');
  });

  const darkVision = computed(() =>
    specie?.properties.darkVision ? `${specie.properties.darkVision} фт.` : '',
  );

  const activeFeatures = ref<Array<string>>([]);

  watch(
    () => specie,
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
</script>

<template>
  <AFlex
    :gap="16"
    vertical
  >
    <AFlex
      gap="16"
      wrap="wrap"
    >
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
          :content="specie.properties.sizes.join(', ')"
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
    </AFlex>

    <ATypographyText
      v-if="specie.description"
      :content="specie.description"
      :style="{ whiteSpace: 'pre-wrap' }"
      data-allow-mismatch
    />

    <ACollapse
      v-for="feature in specie.features"
      :key="feature.url"
      v-model:active-key="activeFeatures"
      expand-icon-position="end"
      :bordered="false"
    >
      <ACollapsePanel
        :id="feature.url"
        :key="feature.url"
        data-allow-mismatch
      >
        <template #header>
          <ATypographyTitle
            :level="4"
            data-allow-mismatch
          >
            {{ feature.name.rus }}
          </ATypographyTitle>
        </template>

        <template #default>
          <ATypographyText
            :content="feature.description"
            :style="{ whiteSpace: 'pre-wrap' }"
            data-allow-mismatch
          />
        </template>
      </ACollapsePanel>
    </ACollapse>
  </AFlex>
</template>

<style module lang="scss">
  .stat {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    min-width: 120px;

    text-align: center;

    background-color: var(--color-bg-secondary);
    border-radius: 8px;

    .title {
      flex-shrink: 0;
      padding: 6px 8px;
      background-color: var(--color-hover);
    }

    .value {
      display: flex;
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;

      min-height: 48px;
      padding: 4px 16px;
    }
  }
</style>
