<script setup lang="ts">
  interface SiblingLink {
    name: string;
    url: string;
  }

  defineProps<{
    prev?: SiblingLink;
    next?: SiblingLink;
  }>();

  const showLeftTooltip = ref(false);
  const showRightTooltip = ref(false);

  const handleClick = (url: SiblingLink['url']) => {
    showLeftTooltip.value = false;
    showRightTooltip.value = false;

    navigateTo(url);
  };
</script>

<template>
  <ClientOnly>
    <Teleport
      v-if="prev"
      to="#page-prev"
    >
      <ATooltip
        v-model:open="showLeftTooltip"
        :title="prev.name"
        placement="right"
      >
        <AButton
          class="arrow"
          size="small"
          type="text"
          @click.left.exact.prevent="handleClick(prev.url)"
        >
          <SvgIcon icon="arrow/left" />
        </AButton>
      </ATooltip>
    </Teleport>
  </ClientOnly>

  <slot />

  <ClientOnly>
    <Teleport
      v-if="next"
      to="#page-next"
    >
      <ATooltip
        v-model:open="showRightTooltip"
        :title="next.name"
        placement="left"
      >
        <AButton
          class="arrow"
          size="small"
          type="text"
          @click.left.exact.prevent="handleClick(next.url)"
        >
          <template #icon>
            <SvgIcon icon="arrow/right" />
          </template>
        </AButton>
      </ATooltip>
    </Teleport>
  </ClientOnly>
</template>

<style scoped lang="scss">
  .ant-btn {
    &.arrow {
      width: 100%;
      height: 100%;
    }
  }
</style>
