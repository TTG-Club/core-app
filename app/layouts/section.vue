<script setup lang="ts">
  defineProps<{
    title: string;
  }>();

  const route = useRoute();
  const alert = computed(() => route.meta.alert);
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row">
    <div
      class="sticky top-0 left-0 z-1 shrink-0 border-default backdrop-blur-lg lg:hidden-scrollbar lg:h-dvh lg:border-r lg:backdrop-blur-none"
    >
      <div class="flex w-full flex-col gap-4 p-4 lg:w-60">
        <h2 class="text-2xl text-(--ui-text-highlighted)">{{ title }}</h2>

        <ClientOnly>
          <slot name="controls" />
        </ClientOnly>
      </div>
    </div>

    <div class="flex min-h-dvh flex-auto flex-col gap-4 px-4 pb-8 lg:pt-4">
      <UAlert
        v-if="alert?.description"
        class="shrink-0"
        variant="soft"
        :color="alert.color || 'info'"
        :icon="alert.icon || undefined"
        :title="alert.title || undefined"
        :description="alert.description"
      />

      <div class="flex-auto">
        <slot name="default" />
      </div>
    </div>
  </div>
</template>
