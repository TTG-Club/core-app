<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock } from './ui';

  import TopBar from '~bestiary/body/ui/TopBar.vue';
  import { MarkupRender } from '~ui/markup';

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

        <StatsBlock :creature="creature" />
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <ADivider
          v-if="creature.traits.length > 0"
          orientation="left"
        >
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
            {{ trait.name.rus }}. <MarkupRender :entries="trait.description" />
          </ACol>
        </ARow>

        <ADivider
          v-if="creature.traits.length > 0"
          orientation="left"
        >
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
            {{ action.name.rus }}.
            <MarkupRender :entries="action.description" />
          </ACol>
        </ARow>

        <ADivider
          v-if="creature.bonusActions.length > 0"
          orientation="left"
        >
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
            {{ action.name.rus }}.
            <MarkupRender :entries="action.description" />
          </ACol>
        </ARow>

        <ADivider
          v-if="creature.reactions.length > 0"
          orientation="left"
        >
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
            {{ action.name.rus }}.
            <MarkupRender :entries="action.description" />
          </ACol>
        </ARow>

        <ADivider
          v-if="creature.legendaryActions.length > 0"
          orientation="left"
        >
          <ATypographyText
            type="secondary"
            content="Легендарные действия"
            strong
          />
        </ADivider>

        <ARow
          v-for="action in creature.legendaryActions"
          :key="action.name.eng"
        >
          <ACol>
            {{ action.name.rus }}.
            <MarkupRender :entries="action.description" />
          </ACol>
        </ARow>

        <ADivider
          v-if="creature.description.length > 0"
          orientation="left"
        >
          <ATypographyText
            type="secondary"
            content="Описание"
            strong
          />
        </ADivider>

        <DescriptionsBlock :description="creature.description" />
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
