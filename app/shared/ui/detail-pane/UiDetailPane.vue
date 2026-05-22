<script setup lang="ts">
  import type { Dayjs } from 'dayjs';

  import type { SourceResponse } from '~/shared/types';

  import type { DrawerTitleName } from '../drawer/ui';

  import { DrawerActions, DrawerBody, DrawerHeader } from '../drawer/ui';

  const {
    title,
    copyTitle = false,
    source = undefined,
    url = undefined,
    editUrl = undefined,
    dateTime = undefined,
    dateTimeFormat = undefined,
  } = defineProps<{
    /** Заголовок панели */
    title: DrawerTitleName;
    /** Источник (книга/справочник) */
    source?: SourceResponse;
    /** Состояние загрузки */
    isLoading?: boolean;
    /** Состояние ошибки */
    isError?: boolean;
    /** Ссылка на элемент */
    url?: string;
    /** Ссылка на редактирование (для админов) */
    editUrl?: string;
    /** Разрешить копирование заголовка */
    copyTitle?: boolean;
    /** Дата и время */
    dateTime?: string | number | Date | Dayjs | null;
    /** Формат даты и времени */
    dateTimeFormat?: string;
  }>();

  defineEmits<{
    /** Событие закрытия панели детального просмотра */
    (event: 'close'): void;
  }>();

  const computedTitle = computed(() =>
    typeof title === 'string' ? title : title?.rus,
  );

  const computedSubtitle = computed(() =>
    typeof title === 'string' ? undefined : title?.eng,
  );
</script>

<template>
  <div
    class="flex h-full w-full min-w-0 flex-col bg-transparent select-text **:select-text"
  >
    <div class="shrink-0 border-b border-default px-4 py-3 md:px-6 md:py-4">
      <DrawerHeader
        :title="computedTitle"
        :subtitle="computedSubtitle"
        :source="source"
        :date-time="dateTime"
        :date-time-format="dateTimeFormat"
        :copy-text="copyTitle"
      >
        <template #actions>
          <slot name="actions" />

          <DrawerActions
            :edit-url="editUrl"
            :url="url"
            @close="$emit('close')"
          />
        </template>
      </DrawerHeader>
    </div>

    <div
      class="min-h-0 w-full min-w-0 flex-auto overflow-x-hidden overflow-y-auto px-4 py-4 md:px-6 md:py-6"
    >
      <DrawerBody
        :is-loading="isLoading"
        :is-error="isError"
      >
        <slot name="default" />
      </DrawerBody>
    </div>
  </div>
</template>
