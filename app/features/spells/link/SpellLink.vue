<script setup lang="ts">
  import { SmallLink } from '~/shared/ui';
  import type { SpellLinkResponse } from '~/shared/types';
  import { SpellLinkComponents, SpellLinkFlags } from './ui';
  import { Breakpoint, useBreakpoints } from '~/shared/composables';
  import { SpellDrawer } from '../drawer';

  const props = withDefaults(
    defineProps<{
      spell: SpellLinkResponse;
      onlyDrawer?: boolean;
    }>(),
    {
      onlyDrawer: false,
    },
  );

  const { greaterOrEqual } = useBreakpoints();

  const isLargeScreen = greaterOrEqual(Breakpoint.LG);

  const isDrawerVisible = ref(false);

  const isDrawerEnabled = computed(
    () => props.onlyDrawer || isLargeScreen.value,
  );

  const route = computed(() => ({
    name: 'spells-url',
    params: {
      url: props.spell.url,
    },
  }));

  function openSpell() {
    if (isDrawerEnabled.value) {
      isDrawerVisible.value = true;

      return;
    }

    navigateTo(route.value);
  }
</script>

<template>
  <NuxtLink
    v-slot="{ href }"
    :to="route"
    custom
  >
    <a
      :href
      @click.left.exact.prevent.stop="openSpell"
    >
      <SmallLink :group="spell.source.group">
        <template #icon>
          {{ spell.level || '◐' }}
        </template>

        <template #default>
          {{ spell.name.rus }}
        </template>

        <template #english>
          {{ spell.name.eng }}
        </template>

        <template #caption>
          <SpellLinkFlags
            :ritual="spell.ritual"
            :concentration="spell.concentration"
          />

          <span :style="{ color: 'var(--color-text-gray)' }">
            {{ spell.school }}
          </span>

          <SpellLinkComponents :components="spell.components" />
        </template>
      </SmallLink>

      <ClientOnly>
        <SpellDrawer
          v-model="isDrawerVisible"
          :url="spell.url"
        />
      </ClientOnly>
    </a>
  </NuxtLink>
</template>
