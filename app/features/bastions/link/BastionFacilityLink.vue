<script setup lang="ts">
  import type { BastionFacilityLinkResponse } from '../model';

  import { SmallLink } from '~ui/link';

  import { BastionFacilityDrawer } from '../drawer';

  const { facility } = defineProps<{
    facility: BastionFacilityLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(BastionFacilityDrawer, {
    props: {
      url: facility.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const { isOpened, handleOpen } = useSectionLink(facility.url, drawer.id, () =>
    drawer.open(),
  );

  /** Подпись под названием: приказы сооружения или его вид. */
  const caption = computed(() => {
    const orders = (facility.orders ?? []).map((order) => order.name);

    return orders.length ? orders.join(', ') : (facility.category?.name ?? '—');
  });
</script>

<template>
  <SmallLink
    :to="{ name: 'bastions-url', params: { url: facility.url } }"
    :title="`${facility.name.rus} [${facility.name.eng}]`"
    :source="facility.source"
    :is-opened
    @open-drawer="handleOpen"
  >
    <template #default>
      {{ facility.name.rus }}
    </template>

    <template #english>
      {{ facility.name.eng }}
    </template>

    <template #caption>
      <span>{{ caption }}</span>
    </template>
  </SmallLink>
</template>
