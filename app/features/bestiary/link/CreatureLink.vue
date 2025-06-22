<script setup lang="ts">
  import { CreatureDrawer } from '~bestiary/drawer';
  import { SmallLink } from '~ui/link';

  import type { CreatureLinkResponse } from '~/features/bestiary/types';
  import type { SpellDetailResponse } from '~/shared/types';

  const { creature } = defineProps<{
    creature: CreatureLinkResponse;
  }>();

  const overlay = useOverlay();

  const {
    data: detail,
    status,
    execute,
  } = await useAsyncData(
    computed(() => `creature-${creature.url}`),
    () => $fetch<SpellDetailResponse>(`/api/v2/bestiary/${creature.url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(CreatureDrawer, {
    props: computed(() => ({
      creature: detail.value,
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
    :to="{ name: 'bestiary-url', params: { url: creature.url } }"
    :title="`${creature.name.rus} [${creature.name.eng}]`"
    :group="creature.source.group"
    :is-opened
    @open-drawer="open"
  >
    <template #icon>
      {{ creature.challengeRailing }}
    </template>

    <template #default>
      {{ creature.name.rus }}
    </template>

    <template #english>
      {{ creature.name.eng }}
    </template>

    <template #caption>
      <span class="text-(--color-text-gray)">
        {{ creature.type }}
      </span>
    </template>
  </SmallLink>
</template>
