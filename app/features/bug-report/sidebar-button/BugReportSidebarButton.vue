<script setup lang="ts">
  import { useBugReport } from '../composables';
  import { SelectionReportButton } from '../selection';

  // Модалка тянет за собой редактор разметки (tiptap с prosemirror — больше
  // мегабайта скрипта). Кнопка стоит в сайдбаре каждой страницы, а модалку
  // открывают редко, поэтому она грузится отдельным чанком при первом открытии,
  // а не в стартовом скрипте
  const BugReportModal = defineAsyncComponent(() =>
    import('../modal').then((modalModule) => modalModule.BugReportModal),
  );

  const { isModalOpen, openReport } = useBugReport();

  /** Баг-репорт уже открывали — дальше модалка живёт смонтированной, как раньше */
  const isModalRequested = ref(false);

  watchImmediate(isModalOpen, (isOpen) => {
    if (isOpen) {
      isModalRequested.value = true;
    }
  });
</script>

<template>
  <UButton
    icon="tabler:bug"
    variant="ghost"
    color="neutral"
    size="xl"
    @click.left.exact.prevent="openReport"
  />

  <ClientOnly>
    <SelectionReportButton />

    <BugReportModal v-if="isModalRequested" />
  </ClientOnly>
</template>
