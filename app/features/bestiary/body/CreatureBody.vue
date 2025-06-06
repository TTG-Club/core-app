<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock, TopBar } from './ui';

  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';
  import { RatingWidget } from '~ui/rating';

  import type { CreatureDetailResponse } from '~/features/bestiary/types';

  defineProps<{
    creature: CreatureDetailResponse;
  }>();

  const expanded = useState(() => [
    'traits',
    'actions',
    'bonusActions',
    'description',
  ]);
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <AFlex
        vertical
        :gap="12"
        :class="$style.info"
      >
        <TopBar :header="creature.header" />

        <RatingWidget
          section="bestiary"
          :url="creature.url"
        />

        <StatsBlock v-bind="creature" />

        <div :class="$style.galleryImg">
          <UiGallery :preview="creature.image || '/img/no-img.webp'" />
        </div>
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <template v-if="creature.traits?.length">
          <ACollapse
            v-model:active-key="expanded"
            :bordered="false"
            destroy-inactive-panel
            ghost
          >
            <ACollapsePanel
              key="traits"
              data-allow-mismatch
            >
              <template #header>
                <ATypographyTitle
                  :level="4"
                  data-allow-mismatch
                  content="Особенности"
                >
                </ATypographyTitle>
              </template>

              <template #default>
                <ARow
                  v-for="trait in creature.traits"
                  :key="trait.name.eng"
                >
                  <ACol>
                    <strong>{{ trait.name.rus }}.</strong>

                    <MarkupRender :entries="trait.description" />
                  </ACol>
                </ARow>
              </template>
            </ACollapsePanel>
          </ACollapse>
        </template>

        <template v-if="creature.actions?.length">
          <ACollapse
            v-model:active-key="expanded"
            :bordered="false"
            destroy-inactive-panel
            ghost
          >
            <ACollapsePanel
              key="actions"
              data-allow-mismatch
            >
              <template #header>
                <ATypographyTitle
                  :level="4"
                  data-allow-mismatch
                  content="Действия"
                >
                </ATypographyTitle>
              </template>

              <template #default>
                <ARow
                  v-for="trait in creature.actions"
                  :key="trait.name.eng"
                >
                  <ACol>
                    <strong>{{ trait.name.rus }}.</strong>

                    <MarkupRender :entries="trait.description" />
                  </ACol>
                </ARow>
              </template>
            </ACollapsePanel>
          </ACollapse>
        </template>

        <template v-if="creature.bonusActions?.length">
          <ACollapse
            v-model:active-key="expanded"
            :bordered="false"
            destroy-inactive-panel
            ghost
          >
            <ACollapsePanel
              key="bonusActions"
              data-allow-mismatch
            >
              <template #header>
                <ATypographyTitle
                  :level="4"
                  data-allow-mismatch
                  content="Бонусные действия"
                >
                </ATypographyTitle>
              </template>

              <template #default>
                <ARow
                  v-for="trait in creature.bonusActions"
                  :key="trait.name.eng"
                >
                  <ACol>
                    <strong>{{ trait.name.rus }}.</strong>

                    <MarkupRender :entries="trait.description" />
                  </ACol>
                </ARow>
              </template>
            </ACollapsePanel>
          </ACollapse>
        </template>

        <template v-if="creature.reactions?.length">
          <ACollapse
            v-model:active-key="expanded"
            :bordered="false"
            destroy-inactive-panel
            ghost
          >
            <ACollapsePanel
              key="reactions"
              data-allow-mismatch
            >
              <template #header>
                <ATypographyTitle
                  :level="4"
                  data-allow-mismatch
                  content="Реакции"
                >
                </ATypographyTitle>
              </template>

              <template #default>
                <ARow
                  v-for="trait in creature.reactions"
                  :key="trait.name.eng"
                >
                  <ACol>
                    <strong>{{ trait.name.rus }}.</strong>

                    <MarkupRender :entries="trait.description" />
                  </ACol>
                </ARow>
              </template>
            </ACollapsePanel>
          </ACollapse>
        </template>

        <template v-if="creature.legendaryActions?.length">
          <ACollapse
            v-model:active-key="expanded"
            :bordered="false"
            destroy-inactive-panel
            ghost
          >
            <ACollapsePanel
              key="legendaryActions"
              data-allow-mismatch
            >
              <template #header>
                <ATypographyTitle
                  :level="4"
                  data-allow-mismatch
                  content="Легендарные действия"
                >
                </ATypographyTitle>
              </template>

              <template #default>
                <p>
                  <strong>Использования легендарных действий:</strong>

                  {{ creature.legendaryAction }}
                  <span v-if="creature.legendaryActionInLair">
                    ({{ creature.legendaryActionInLair }} в логове)
                  </span>
                  . Сразу после хода другого существа
                  {{ creature.name.rus }} может потратить 1 использование, чтобы
                  выполнить одно из следующих действий.
                  {{ creature.name.rus }} восстанавливает все потраченные
                  использования в начале своего хода.
                </p>

                <ul v-if="creature.legendaryActions?.length">
                  <li
                    v-for="action in creature.legendaryActions"
                    :key="action.name.eng"
                  >
                    <strong>{{ action.name.rus }}.</strong>

                    <MarkupRender :entries="action.description" />
                  </li>
                </ul>
              </template>
            </ACollapsePanel>
          </ACollapse>
        </template>

        <template v-if="creature.section">
          <template v-if="creature.section.name.eng !== creature.name.eng">
            <ARow> {{ creature.section.name.rus }} </ARow>

            <ARow>{{ creature.section.name.eng }} </ARow>
          </template>

          <ARow v-if="creature.section?.subtitle"
            ><i> {{ creature.section.subtitle }} </i>
          </ARow>

          <ARow v-if="creature.section?.habitats"
            ><strong>Среда обитания:</strong>
            {{ creature.section.habitats }}</ARow
          >

          <ARow v-if="creature.section?.treasures"
            ><strong>Сокровища:</strong> {{ creature.section.treasures }}</ARow
          >

          <DescriptionsBlock :description="creature.section?.description" />
        </template>

        <template v-if="creature.description?.length">
          <ACollapse
            v-model:active-key="expanded"
            :bordered="false"
            destroy-inactive-panel
          >
            <ACollapsePanel
              key="description"
              data-allow-mismatch
            >
              <template #header>
                <ATypographyTitle
                  :level="4"
                  data-allow-mismatch
                  content="Описание"
                >
                </ATypographyTitle>
              </template>

              <template #default>
                <DescriptionsBlock :description="creature.description" />
              </template>
            </ACollapsePanel>
          </ACollapse>
        </template>
      </AFlex>
    </div>
  </div>
</template>

<style module lang="scss">
  :deep(.ant-collapse-header) {
    position: absolute;
    display: flex;
  }
  .container {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @container (width > 800px) {
      flex-direction: row;
      gap: 28px;
    }
  }

  .info {
    width: 100%;
    max-width: 100%;

    @container (width > 800px) {
      max-width: 320px;
    }
  }
</style>
