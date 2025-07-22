<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock, TopBar } from './ui';

  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';
  import { RatingWidget } from '~ui/rating';
  import { UiCollapse } from '~ui/collapse';

  import type { CreatureDetailResponse } from '~/features/bestiary/types';

  defineProps<{
    creature: CreatureDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <div
        class="flex flex-col gap-3"
        :class="$style.info"
      >
        <TopBar :header="creature.header" />

        <div :class="$style.block">
          <div :class="$style.portrait">
            <UiGallery :preview="creature.image || '/img/no-img.webp'" />
          </div>

          <RatingWidget
            section="bestiary"
            :url="creature.url"
          />
        </div>

        <StatsBlock v-bind="creature" />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <template v-if="creature.traits?.length">
          <UiCollapse default-open>
            <template #default> Особенности </template>

            <template #content>
              <p
                v-for="trait in creature.traits"
                :key="trait.name.eng"
              >
                <strong>{{ trait.name.rus }}. </strong>

                <MarkupRender :entries="trait.description" />
              </p>
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.actions?.length">
          <UiCollapse default-open>
            <template #default> Действия </template>

            <template #content>
              <p
                v-for="trait in creature.actions"
                :key="trait.name.eng"
              >
                <strong>{{ trait.name.rus }}. </strong>

                <MarkupRender :entries="trait.description" />
              </p>
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.bonusActions?.length">
          <UiCollapse default-open>
            <template #default> Бонусные действия </template>

            <template #content>
              <p
                v-for="trait in creature.bonusActions"
                :key="trait.name.eng"
              >
                <strong>{{ trait.name.rus }}. </strong>

                <MarkupRender :entries="trait.description" />
              </p>
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.reactions?.length">
          <UiCollapse default-open>
            <template #default> Реакции </template>

            <template #content>
              <p
                v-for="trait in creature.reactions"
                :key="trait.name.eng"
              >
                <strong>{{ trait.name.rus }}. </strong>

                <MarkupRender :entries="trait.description" />
              </p>
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.legendaryActions?.length">
          <UiCollapse default-open>
            <template #default> Легендарные действия </template>

            <template #content>
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
                  <p>
                    <strong>{{ action.name.rus }}. </strong>

                    <MarkupRender :entries="action.description" />
                  </p>
                </li>
              </ul>
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.section">
          <UiCollapse default-open>
            <template #default> Эффекты местности </template>

            <template #content>
              <p v-if="creature.section">
                <strong>Среда обитания: </strong>
                {{ creature.section.habitats }}
              </p>

              <p v-if="creature.section?.treasures">
                <strong>Сокровища:</strong> {{ creature.section.treasures }}
              </p>
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.description?.length">
          <UiCollapse default-open>
            <template #default> Описание </template>

            <template #content>
              <p>
                <template
                  v-if="creature.section.name.eng !== creature.name.eng"
                >
                  <span> {{ creature.section.name.rus }} </span>

                  <span>{{ creature.section.name.eng }} </span>
                </template>

                <span v-if="creature.section?.subtitle">
                  <i> {{ creature.section.subtitle }} </i>
                </span>
              </p>

              <DescriptionsBlock :description="creature.description" />

              <template v-if="creature.section">
                <DescriptionsBlock
                  :description="creature.section?.description"
                />
              </template>
            </template>
          </UiCollapse>
        </template>
      </div>
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

    .block {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .portrait {
      overflow: hidden;

      width: 110px;
      min-width: 110px;
      height: 110px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }
  }
</style>
