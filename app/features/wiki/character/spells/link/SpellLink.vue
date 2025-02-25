<script setup lang="ts">
  import { SmallLink } from '~/shared/ui';
  import type { RoutesNamedLocationsResolved } from '@typed-router';
  import type { SpellLink } from '~/shared/types';

  const { spell } = defineProps<{
    spell: SpellLink;
  }>();

  const route = computed<RoutesNamedLocationsResolved>(() => ({
    name: 'spells-url',
    params: {
      url: spell.url,
    },
  }));
</script>

<template>
  <NuxtLink :to="route">
    <SmallLink
      :tag-tooltip="spell.group.name"
      :tag-color="spell.group.label"
    >
      <template #icon>
        <ATooltip
          :title="spell.level ? undefined : 'Заговор'"
          :mouse-enter-delay="0.7"
          destroy-tooltip-on-hide
        >
          {{ spell.level || '◐' }}
        </ATooltip>
      </template>

      <template #default>
        {{ spell.name.rus }}
      </template>

      <template #english>
        {{ spell.name.eng }}
      </template>

      <template #tag> {{ spell.group.label }} </template>

      <template #caption>
        <div>
          <ATooltip
            :mouse-enter-delay="0.7"
            title="Концентрация"
            destroy-tooltip-on-hide
          >
            <ATag v-if="spell.concentration">К</ATag>
          </ATooltip>

          <ATooltip
            :mouse-enter-delay="0.7"
            title="Ритуал"
            destroy-tooltip-on-hide
          >
            <ATag v-if="spell.ritual">Р</ATag>
          </ATooltip>
        </div>

        <span :class="$style.school">
          {{ spell.school }}
        </span>

        <AFlex
          :class="$style.components"
          :gap="4"
        >
          <ATooltip
            :mouse-enter-delay="0.7"
            title="Вербальный компонент"
            destroy-tooltip-on-hide
          >
            <span :class="$style.component">
              {{ spell.components.v ? 'В' : '·' }}
            </span>
          </ATooltip>

          <ATooltip
            :mouse-enter-delay="0.7"
            title="Соматический компонент"
            destroy-tooltip-on-hide
          >
            <span :class="$style.component">
              {{ spell.components.s ? 'С' : '·' }}
            </span>
          </ATooltip>

          <ATooltip
            :mouse-enter-delay="0.7"
            title="Материальный компонент"
            destroy-tooltip-on-hide
          >
            <span :class="$style.component">
              {{ spell.components.m ? 'М' : '·' }}
            </span>
          </ATooltip>
        </AFlex>
      </template>
    </SmallLink>
  </NuxtLink>
</template>

<style module lang="scss">
  .school {
    color: var(--color-text-g);
  }

  .components {
    margin-left: auto;
  }

  .component {
    width: 12px;
    text-align: center;
  }
</style>
