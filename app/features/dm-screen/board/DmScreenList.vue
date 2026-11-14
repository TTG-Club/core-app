<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_TEXT,
    getScreenWindowIcon,
    isScreenNotePath,
  } from '../model';
  import { DmScreenNote } from '../window';

  /**
   * Ширма на телефоне: окнам негде встать рядом, поэтому записи идут
   * списком ссылок на их страницы. У заметки страницы нет: она раскрыта
   * прямо в списке, там же её правят.
   */
  const { windows, close } = useDmScreen();

  const rows = computed(() =>
    windows.value.map((screenWindow) => ({
      screenWindow,
      isNote: isScreenNotePath(screenWindow.path),
      // У заметки страницы нет: её название — текст, а не ссылка
      titleTag: isScreenNotePath(screenWindow.path) ? 'span' : 'a',
      href: isScreenNotePath(screenWindow.path) ? undefined : screenWindow.path,
      icon: getScreenWindowIcon(screenWindow.path),
      removeLabel: `${DM_SCREEN_TEXT.remove}: ${screenWindow.title}`,
    })),
  );
</script>

<template>
  <ul class="flex flex-col gap-2 p-4">
    <li
      v-for="row in rows"
      :key="row.screenWindow.id"
      class="flex flex-col rounded-lg border border-default bg-elevated/50"
    >
      <div class="flex items-center gap-2 pr-1">
        <component
          :is="row.titleTag"
          :href="row.href"
          class="flex min-w-0 flex-auto items-center gap-3 p-3"
        >
          <UIcon
            :name="row.icon"
            class="size-5 shrink-0 text-primary"
          />

          <span class="truncate text-highlighted">
            {{ row.screenWindow.title }}
          </span>
        </component>

        <UButton
          :icon="DM_SCREEN_ICONS.close"
          :aria-label="row.removeLabel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close(row.screenWindow.id)"
        />
      </div>

      <DmScreenNote
        v-if="row.isNote"
        :screen-window="row.screenWindow"
        show-toggle
        class="px-3 pb-3"
      />
    </li>
  </ul>
</template>
