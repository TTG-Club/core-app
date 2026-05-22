<script setup lang="ts">
  import type { SpellLinkResponse } from '~spells/model';

  import { SpellDrawer } from '~spells/drawer';
  import { SmallLink } from '~ui/link';

  import { SpellLinkComponents, SpellLinkFlags } from './ui';

  const { spell } = defineProps<{
    spell: SpellLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(SpellDrawer, {
    props: {
      url: spell.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const { isOpened, handleOpen } = useSectionLink(spell.url, drawer.id, () =>
    drawer.open(),
  );
</script>

<template>
  <SmallLink
    :to="{ name: 'spells-url', params: { url: spell.url } }"
    :title="`${spell.name.rus} [${spell.name.eng}]`"
    :source="spell.source"
    :is-opened
    @open-drawer="handleOpen"
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
      <span class="flex w-full items-center">
        <span class="flex items-center gap-1">
          <SpellLinkFlags
            :ritual="spell.ritual"
            :concentration="spell.concentration"
          />

          <span>{{ spell.school }}</span>
        </span>

        <SpellLinkComponents
          class="ml-auto"
          :components="spell.components"
        />
      </span>
    </template>
  </SmallLink>
</template>
