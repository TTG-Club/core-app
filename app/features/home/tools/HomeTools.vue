<script setup lang="ts">
  import type { HomeTool } from './model';

  import { MulticlassDrawer } from '~classes/multiclass-drawer';

  import { HOME_TOOLS } from './model';

  const { user } = useUser();

  // Пункты с ролями видны только пользователям с подходящей ролью — как в меню
  // сайдбара (MenuSection).
  const tools = computed(() =>
    HOME_TOOLS.filter((tool) => {
      if (!Array.isArray(tool.roles)) {
        return true;
      }

      return tool.roles.some((role) => user.value?.roles.includes(role));
    }),
  );

  const linkTag = resolveComponent('NuxtLink');

  const overlay = useOverlay();

  const multiclassDrawer = overlay.create(MulticlassDrawer, {
    props: {
      url: '',
      name: {
        rus: '',
        eng: '',
      },
      parent: undefined,
      onClose: () => multiclassDrawer.close(),
    },
    destroyOnClose: true,
  });

  function handleClick(event: MouseEvent, tool: HomeTool) {
    if (tool.to) {
      return;
    }

    event.preventDefault();

    if (tool.action === 'open-multiclass') {
      multiclassDrawer.open();
    }
  }
</script>

<template>
  <UCard
    :ui="{
      root: 'bg-muted',
      header: 'p-3 sm:p-3',
      body: 'p-2 sm:p-2',
    }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:tools"
          class="size-5 text-primary"
        />

        <h3 class="text-base leading-none font-medium">Инструменты</h3>
      </div>
    </template>

    <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
      <component
        :is="tool.to ? linkTag : 'button'"
        v-for="tool in tools"
        :key="tool.label"
        :to="tool.to"
        :class="[
          'group flex cursor-pointer items-center gap-3 rounded-lg p-2',
          'text-left no-underline transition-colors hover:bg-elevated',
        ]"
        @click.left.exact="handleClick($event, tool)"
      >
        <span
          :class="[
            'flex size-9 shrink-0 items-center justify-center',
            'rounded-lg bg-elevated text-primary',
            'transition-colors group-hover:bg-accented',
          ]"
        >
          <UIcon
            :name="tool.icon"
            class="size-5"
          />
        </span>

        <span
          class="text-sm leading-tight font-medium text-highlighted group-hover:text-primary"
        >
          {{ tool.label }}
        </span>
      </component>
    </div>
  </UCard>
</template>
