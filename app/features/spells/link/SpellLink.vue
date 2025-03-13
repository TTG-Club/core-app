<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';
  import { SpellLinkComponents, SpellLinkFlags } from './ui';
  import { SpellDrawer } from '~spells/drawer';
  import { SmallLink } from '~ui/link';

  const { spell } = defineProps<{
    spell: SpellLinkResponse;
  }>();

  const isDrawerVisible = ref(false);
</script>

<template>
  <SmallLink
    :title="`${spell.name.rus} [${spell.name.eng}]`"
    :is-drawer-opened="isDrawerVisible"
    :group="spell.source.group"
    :to="{ name: 'spells-url', params: { url: spell.url } }"
    @open-drawer="isDrawerVisible = true"
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

    <template #drawer>
      <SpellDrawer
        v-model="isDrawerVisible"
        :url="spell.url"
      />
    </template>
  </SmallLink>
</template>
