<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';

  import type { Role } from '~/shared/types';

  const { items } = defineProps<{
    label: string;
    items: Array<{
      href: string;
      label: string;
      disabled?: boolean;
      roles?: Array<Role>;
    }>;
  }>();

  const { user } = storeToRefs(useUserStore());

  const links = computed(() =>
    items.map((link) => {
      if (!Array.isArray(link.roles)) {
        return link;
      }

      const available = link.roles.some((role) =>
        user.value?.roles.includes(role),
      );

      return {
        ...link,
        disabled: link.disabled || !available,
      };
    }),
  );
</script>

<template>
  <div
    class="flex flex-col"
    :class="$style.menu"
  >
    <span :class="$style.title">{{ label }}</span>

    <NuxtLink
      v-for="link in links"
      :key="link.href"
      :class="[$style.item, { [$style.disabled]: link.disabled }]"
      :to="link.href"
    >
      {{ link.label }}
    </NuxtLink>
  </div>
</template>

<style lang="scss" module>
  .menu {
    width: 100%;
    min-width: 200px;
    max-width: 240px;
    margin: 0;
    padding: 0;

    list-style: none;
  }
  .title {
    margin-bottom: 4px;
    padding: 0 16px;

    font-size: 13px;
    font-weight: 200;
    color: var(--ui-text-toned);
  }
  .item {
    padding: 6px 16px;
    border-radius: 6px;
    &:hover {
      background-color: var(--color-hover);
      transition: all 0.15s ease-in-out;
    }
  }

  .disabled {
    pointer-events: none;
    opacity: 0.4;
  }
</style>
