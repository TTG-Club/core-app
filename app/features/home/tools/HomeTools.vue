<script setup lang="ts">
  import type { HomeTool } from './model';

  import { MulticlassDrawer } from '~classes/multiclass-drawer';

  import { HOME_TOOLS, HOME_TOOLS_LABEL } from './model';

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
  <!--
    Инструменты вынесены из карточки в строку-ленту прямо под поиском: это
    второй по важности сценарий после поиска, и в шапке они попадаются на глаза
    первыми. На узком экране лента переносится по строкам, подписи не режем.
  -->
  <nav
    :aria-label="HOME_TOOLS_LABEL"
    class="flex flex-wrap items-center justify-center gap-2"
  >
    <component
      :is="tool.to ? linkTag : 'button'"
      v-for="tool in tools"
      :key="tool.label"
      :to="tool.to"
      :type="tool.to ? undefined : 'button'"
      :class="[
        'group flex cursor-pointer items-center gap-2 no-underline',
        'rounded-lg border border-default bg-muted/60 px-3 py-2',
        'text-sm leading-none font-medium text-toned',
        'transition-colors duration-200',
        'hover:border-accented hover:bg-elevated hover:text-highlighted',
      ]"
      @click.left.exact="handleClick($event, tool)"
    >
      <UIcon
        :name="tool.icon"
        class="size-4.5 shrink-0 text-dimmed transition-colors group-hover:text-primary"
      />

      {{ tool.label }}
    </component>
  </nav>
</template>
