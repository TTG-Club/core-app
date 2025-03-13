<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';
  import { SpellLinkComponents, SpellLinkFlags } from './ui';
  import { Breakpoint, useBreakpoints } from '~/shared/composables';
  import { SpellDrawer } from '~spells/drawer';
  import { SmallLink } from '~ui/link';

  const props = withDefaults(
    defineProps<{
      spell: SpellLinkResponse;
      onlyDrawer?: boolean;
    }>(),
    {
      onlyDrawer: false,
    },
  );

  const link = useTemplateRef('link');
  const isDrawerEnabled = useElementVisibility(link);
  const { isGreaterOrEqual } = useBreakpoints();

  const isDrawerVisible = ref(false);

  const route = computed(() => ({
    name: 'spells-url',
    params: {
      url: props.spell.url,
    },
  }));

  function openSpell() {
    if (isDrawerOpening()) {
      isDrawerVisible.value = true;

      return;
    }

    navigateTo(route.value);
  }

  function isDrawerOpening() {
    return isGreaterOrEqual(Breakpoint.LG) || props.onlyDrawer;
  }
</script>

<template>
  <NuxtLink
    v-slot="{ href }"
    :to="route"
    custom
  >
    <a
      ref="link"
      :href
      @click.left.exact.prevent.stop="openSpell"
    >
      <SmallLink
        :group="spell.source.group"
        :title="`${spell.name.rus} [${spell.name.eng}]`"
      >
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
          v-if="isDrawerEnabled"
          v-model="isDrawerVisible"
          :url="spell.url"
        />
      </ClientOnly>
    </a>
  </NuxtLink>
</template>
