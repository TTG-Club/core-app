<script setup lang="ts">
  import type { ScreenEntryLocation } from '../model';

  import { UiResult } from '~ui/result';

  import {
    DM_SCREEN_CLASSES_PATH,
    DM_SCREEN_SKELETON_LINES,
    DM_SCREEN_TEXT,
    getScreenEntryTitle,
  } from '../model';
  import { DM_SCREEN_ENTRY_BODIES } from './entries';

  /**
   * Запись раздела в окне ширмы: карточка выбирается по разделу, а запись
   * грузится тем же запросом и под тем же ключом, что в дровере раздела.
   * Когда запись загрузится, окно узнаёт её название.
   */
  const { entry } = defineProps<{
    /**
     * Раздел записи и её `url`; при смене записи компонент создаётся
     * заново, поэтому ключ и адрес запроса постоянны.
     */
    entry: ScreenEntryLocation;
  }>();

  const emit = defineEmits<{
    /** Запись загрузилась: её название для шапки окна. */
    loaded: [title: string];
    /** Карточка просит открыть в этом же окне другую запись. */
    navigate: [path: string];
  }>();

  const bodyComponent = DM_SCREEN_ENTRY_BODIES[entry.section.path];

  const { data: detail, status } = useAsyncData<unknown>(
    `${entry.section.cacheKey}-${entry.url}`,
    () => $fetch<unknown>(`${entry.section.apiPath}/${entry.url}`),
    { server: false },
  );

  const isFailed = computed(() => status.value === 'error');

  /**
   * Открывает в этом окне подкласс или родительский класс.
   * @param classUrl - `url` класса или подкласса
   */
  function navigateToClass(classUrl: string): void {
    emit('navigate', `/${DM_SCREEN_CLASSES_PATH}/${classUrl}`);
  }

  const bodyProps = computed<Record<string, unknown> | undefined>(() => {
    if (!detail.value) {
      return undefined;
    }

    // Карточка класса умеет переходить к подклассам, не покидая окна
    return entry.section.path === DM_SCREEN_CLASSES_PATH
      ? {
          [entry.section.bodyProp]: detail.value,
          navigateInPlace: true,
          onNavigate: navigateToClass,
        }
      : { [entry.section.bodyProp]: detail.value };
  });

  watchImmediate(detail, (loadedDetail) => {
    const title = getScreenEntryTitle(loadedDetail);

    if (title) {
      emit('loaded', title);
    }
  });
</script>

<template>
  <UiResult
    v-if="isFailed"
    :title="DM_SCREEN_TEXT.entryFailed"
    status="error"
  />

  <Suspense v-else-if="bodyProps">
    <component
      :is="bodyComponent"
      v-bind="bodyProps"
    />
  </Suspense>

  <div
    v-else
    class="flex flex-col gap-2"
  >
    <USkeleton class="h-7 w-2/3" />

    <USkeleton
      v-for="line in DM_SCREEN_SKELETON_LINES"
      :key="line"
      class="h-4 w-full"
    />
  </div>
</template>
