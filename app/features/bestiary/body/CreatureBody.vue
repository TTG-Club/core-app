<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock, TopBar } from './ui';

  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';
  import { RatingWidget } from '~ui/rating';

  import type { CreatureDetailResponse } from '~/features/bestiary/types';

  defineProps<{
    creature: CreatureDetailResponse;
  }>();
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
          <ADivider orientation="left">
            <ATypographyText
              type="secondary"
              content="Особенности"
              strong
            />
          </ADivider>

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

        <template v-if="creature.actions?.length">
          <ADivider orientation="left">
            <ATypographyText
              type="secondary"
              content="Действия"
              strong
            />
          </ADivider>

          <ARow
            v-for="action in creature.actions"
            :key="action.name.eng"
          >
            <ACol>
              <strong>{{ action.name.rus }}.</strong>

              <MarkupRender :entries="action.description" />
            </ACol>
          </ARow>
        </template>

        <template v-if="creature.bonusActions?.length">
          <ADivider orientation="left">
            <ATypographyText
              type="secondary"
              content="Бонусные действия"
              strong
            />
          </ADivider>

          <ARow
            v-for="action in creature.bonusActions"
            :key="action.name.eng"
          >
            <ACol>
              <strong>{{ action.name.rus }}.</strong>

              <MarkupRender :entries="action.description" />
            </ACol>
          </ARow>
        </template>

        <template v-if="creature.reactions?.length">
          <ADivider orientation="left">
            <ATypographyText
              type="secondary"
              content="Реакции"
              strong
            />
          </ADivider>

          <ARow
            v-for="action in creature.reactions"
            :key="action.name.eng"
          >
            <ACol>
              <strong>{{ action.name.rus }}.</strong>

              <MarkupRender :entries="action.description" />
            </ACol>
          </ARow>
        </template>

        <template v-if="creature.legendaryActions?.length">
          <ADivider orientation="left">
            <ATypographyText
              type="secondary"
              content="Легендарные действия"
              strong
            />
          </ADivider>

          <ARow>
            <ACol>
              <strong>Использования легендарных действий:</strong>

              {{ creature.legendaryAction }}
              <span v-if="creature.legendaryActionInLair">
                ({{ creature.legendaryActionInLair }} в логове)
              </span>
              . Сразу после хода другого существа {{ creature.name.rus }} может
              потратить 1 использование, чтобы выполнить одно из следующих
              действий. {{ creature.name.rus }} восстанавливает все потраченные
              использования в начале своего хода.
            </ACol>
          </ARow>
        </template>

        <ul v-if="creature.legendaryActions?.length">
          <li
            v-for="action in creature.legendaryActions"
            :key="action.name.eng"
          >
            <strong>{{ action.name.rus }}.</strong>

            <MarkupRender :entries="action.description" />
          </li>
        </ul>

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
          <ADivider orientation="left">
            <ATypographyText
              type="secondary"
              content="Описание"
              strong
            />
          </ADivider>

          <DescriptionsBlock :description="creature.description" />
        </template>
      </AFlex>
    </div>
  </div>
</template>

<style module lang="scss">
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
