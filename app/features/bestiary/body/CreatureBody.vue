<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock, TopBar } from './ui';

  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';
  import { RatingWidget } from '~ui/rating';
  import { UiCollapse } from '~ui/collapse';

  import type { CreatureDetailResponse } from '~/features/bestiary/types';
  import { pick } from 'lodash-es';
  import { UiAction } from '~ui/action';

  const { creature } = defineProps<{
    creature: CreatureDetailResponse;
  }>();

  const stats = computed(() =>
    pick(
      creature,
      'ac',
      'cr',
      'initiative',
      'hit',
      'speed',
      'abilities',
      'skills',
      'equipments',
      'vulnerability',
      'resistance',
      'immunity',
      'sense',
      'languages',
    ),
  );

  const hasLair = computed(
    () => creature.lair?.description || creature.lair?.effects?.length,
  );

  const hasSection = computed(
    () =>
      creature.section?.description ||
      creature.section?.habitats ||
      creature.section?.treasures,
  );
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

        <StatsBlock v-bind="stats" />
      </div>

      <div class="flex flex-auto flex-col gap-6">
        <template v-if="creature.traits?.length">
          <UiCollapse default-open>
            <template #default> Особенности </template>

            <template #content>
              <UiAction
                v-for="trait in creature.traits"
                :key="trait.name.eng"
                :label="trait.name.rus"
                :text="trait.description"
              />
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.actions?.length">
          <UiCollapse default-open>
            <template #default> Действия </template>

            <template #content>
              <UiAction
                v-for="action in creature.actions"
                :key="action.name.eng"
                :label="action.name.rus"
                :text="action.description"
              />
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.bonusActions?.length">
          <UiCollapse default-open>
            <template #default> Бонусные действия </template>

            <template #content>
              <UiAction
                v-for="bonusAction in creature.bonusActions"
                :key="bonusAction.name.eng"
                :label="bonusAction.name.rus"
                :text="bonusAction.description"
              />
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.reactions?.length">
          <UiCollapse default-open>
            <template #default> Реакции </template>

            <template #content>
              <UiAction
                v-for="reaction in creature.reactions"
                :key="reaction.name.eng"
                :label="reaction.name.rus"
                :text="reaction.description"
              />
            </template>
          </UiCollapse>
        </template>

        <template v-if="creature.legendary?.actions?.length">
          <UiCollapse default-open>
            <template #default> Легендарные действия </template>

            <template #content>
              <p class="mb-2">
                <strong>Использования легендарных действий:</strong>

                <span>&nbsp;{{ creature.legendary.count }}.</span>

                <span v-if="creature.legendary?.description?.length">
                  {{ creature.legendary.description }}
                </span>

                <span v-else>
                  Сразу после хода другого существа
                  {{ creature.name.rus }} может потратить 1 использование, чтобы
                  выполнить одно из следующих действий.
                  {{ creature.name.rus }} восстанавливает все потраченные
                  использования в начале своего хода.
                </span>
              </p>

              <UiAction
                v-for="action in creature.legendary.actions"
                :key="action.name.eng"
                :label="action.name.rus"
                :text="action.description"
              />
            </template>
          </UiCollapse>
        </template>

        <UiCollapse
          v-if="creature.description"
          default-open
        >
          <template #default> Описание </template>

          <template #content>
            <DescriptionsBlock :description="creature.description" />
          </template>
        </UiCollapse>

        <template v-if="hasLair">
          <UiCollapse default-open>
            <template #default>
              {{ creature.lair.name || 'Описание логова' }}
            </template>

            <template #content>
              <MarkupRender
                v-if="creature.lair.description"
                :entries="creature.lair.description"
              />

              <template v-if="creature.lair?.effects?.length">
                <UiAction
                  v-for="effect in creature.lair.effects"
                  :key="effect.name.eng"
                  :label="effect.name.rus"
                  :text="effect.description"
                />
              </template>

              <MarkupRender
                v-if="creature.lair.ending"
                :entries="creature.lair.ending"
              />
            </template>
          </UiCollapse>
        </template>

        <UiCollapse
          v-if="hasSection"
          default-open
        >
          <template #default>
            {{ creature.section.name.rus }} [{{ creature.section.name.eng }}]
          </template>

          <template
            v-if="creature.section.subtitle"
            #subtitle
          >
            {{ creature.section.subtitle }}
          </template>

          <template #content>
            <div
              v-if="creature.section?.habitats || creature.section?.treasures"
              class="mb-2"
            >
              <p v-if="creature.section?.habitats">
                <strong>Среда обитания: </strong>

                <span>{{ creature.section.habitats }}</span>
              </p>

              <p v-if="creature.section?.treasures">
                <strong>Сокровища: </strong>

                <span>{{ creature.section.treasures }}</span>
              </p>
            </div>

            <DescriptionsBlock
              v-if="creature.section.description"
              :description="creature.section.description"
            />
          </template>
        </UiCollapse>
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
      border: 1px solid var(--ui-border);
      border-radius: 8px;
    }
  }
</style>
