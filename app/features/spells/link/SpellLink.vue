<script setup lang="ts">
  import { SpellLinkComponents, SpellLinkFlags } from './ui';

  import { SpellDrawer } from '~spells/drawer';
  import { SmallLink } from '~ui/link';

  import type { SpellDetailResponse, SpellLinkResponse } from '~/shared/types';

  const { spell } = defineProps<{
    spell: SpellLinkResponse;
  }>();

  const overlay = useOverlay();

  const {
    data: detail,
    status,
    execute,
  } = await useAsyncData(
    computed(() => `spell-${spell.url}`),
    () => $fetch<SpellDetailResponse>(`/api/v2/spells/${spell.url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(SpellDrawer, {
    props: computed(() => ({
      spell: detail.value,
      isError: status.value === 'error',
      isLoading: status.value === 'pending',
      onClose: () => drawer.close(),
    })),
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));

  async function open() {
    if (status.value !== 'success') {
      await execute();
    }

    drawer.open();
  }
</script>

<template>
  <SmallLink
    :to="{ name: 'spells-url', params: { url: spell.url } }"
    :title="`${spell.name.rus} [${spell.name.eng}]`"
    :group="spell.source.group"
    :is-opened
    @open-drawer="open"
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

      <span class="text-(--color-text-gray)">
        {{ spell.school }}
      </span>

      <SpellLinkComponents :components="spell.components" />
    </template>
  </SmallLink>
</template>
