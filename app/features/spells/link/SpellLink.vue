<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';
  import { SpellLinkComponents, SpellLinkFlags } from './ui';
  import { SmallLink } from '~ui/link';
  import { useDrawer } from '~/shared/composables';

  const { spell } = defineProps<{
    spell: SpellLinkResponse;
  }>();

  const { open } = useDrawer('spell-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'spells-url', params: { url: spell.url } }"
    :title="`${spell.name.rus} [${spell.name.eng}]`"
    :group="spell.source.group"
    @open-drawer="open(spell.url)"
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
</template>
