<script setup lang="ts">
  import type { CreatureLinkResponse } from '~bestiary/model';

  import { CreatureDrawer } from '~bestiary/drawer';
  import { SmallLink } from '~ui/link';

  const { creature } = defineProps<{
    creature: CreatureLinkResponse;
  }>();

  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();

  const overlay = useOverlay();

  const drawer = overlay.create(CreatureDrawer, {
    props: {
      url: creature.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => {
    if (isSplitActive.value) {
      return route.query.detail === creature.url;
    }

    return overlay.isOpen(drawer.id);
  });

  function handleOpen() {
    if (isSplitActive.value) {
      router.push({
        query: {
          ...route.query,
          detail: creature.url,
        },
      });

      return;
    }

    drawer.open();
  }
</script>

<template>
  <SmallLink
    :to="{ name: 'bestiary-url', params: { url: creature.url } }"
    :title="`${creature.name.rus} [${creature.name.eng}]`"
    :source="creature.source"
    :is-opened
    @open-drawer="handleOpen"
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
      <span>
        {{ creature.type }}
      </span>
    </template>
  </SmallLink>
</template>
