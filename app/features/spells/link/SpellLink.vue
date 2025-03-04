<script setup lang="ts">
  import { SmallLink } from '~/shared/ui';
  import type { SpellLinkResponse } from '~/shared/types';
  import { SpellLinkComponents, SpellLinkFlags, SpellLinkDrawer } from './ui';
  import { Breakpoint, useBreakpoints } from '~/shared/composables';

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

  const levelTooltip = computed(() =>
    props.spell.level ? undefined : 'Заговор',
  );

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
      <SmallLink
        :tag-tooltip="spell.source.group.rus"
        :tag-color="spell.source.group.label"
      >
        <template #icon>
          <ATooltip
            :title="levelTooltip"
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

        <template #tag> {{ spell.source.group.label }} </template>

        <template #caption>
          <SpellLinkFlags
            :ritual="spell.ritual"
            :concentration="spell.concentration"
          />

          <span :style="{ color: 'var(--color-text-g)' }">
            {{ spell.school }}
          </span>

          <SpellLinkComponents :components="spell.components" />
        </template>
      </SmallLink>

      <SpellLinkDrawer
        v-model="isDrawerVisible"
        :url="spell.url"
      />
    </a>
  </NuxtLink>
</template>
