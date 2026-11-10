<script setup lang="ts">
  import {
    VIDEO_PROVIDER_LABELS,
    VIDEO_RECOGNIZED_PREFIX,
    VIDEO_REMOVE_LABEL,
    VIDEO_UNSUPPORTED_TEXT,
    VIDEO_URL_FIELD_PLACEHOLDER,
  } from './constants';
  import { parseVideoUrl } from './utils';

  /**
   * Поле ссылки на ролик для редакторов. Принимает ссылку любого вида или код
   * iframe, при уходе с поля приводит его к чистой ссылке и сразу подсказывает,
   * распознана ли площадка. Пустое поле = `null` (видео нет).
   */
  const model = defineModel<string | null>({ required: true });

  const text = computed<string>({
    get: () => model.value ?? '',
    set: (value) => {
      model.value = value.trim() ? value : null;
    },
  });

  const source = computed(() => parseVideoUrl(model.value));

  const status = computed(() => {
    if (!model.value) {
      return null;
    }

    return source.value
      ? {
          text: `${VIDEO_RECOGNIZED_PREFIX} ${VIDEO_PROVIDER_LABELS[source.value.provider]}`,
          icon: 'tabler:circle-check',
          class: 'text-success',
        }
      : {
          text: VIDEO_UNSUPPORTED_TEXT,
          icon: 'tabler:alert-circle',
          class: 'text-error',
        };
  });

  /**
   * Приводит распознанную ссылку к чистому виду. Только если она отличается —
   * чтобы не помечать форму изменённой на пустом месте.
   */
  function normalize(): void {
    if (source.value && source.value.url !== model.value) {
      model.value = source.value.url;
    }
  }

  /** Убирает видео из записи. */
  function clear(): void {
    model.value = null;
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <UInput
      v-model="text"
      icon="tabler:brand-youtube"
      :placeholder="VIDEO_URL_FIELD_PLACEHOLDER"
      class="w-full"
      :ui="{ trailing: 'pe-0.5' }"
      @blur="normalize"
    >
      <template
        v-if="model"
        #trailing
      >
        <UButton
          icon="tabler:x"
          variant="link"
          color="neutral"
          size="sm"
          :aria-label="VIDEO_REMOVE_LABEL"
          @click.left.exact.prevent="clear"
        />
      </template>
    </UInput>

    <p
      v-if="status"
      class="flex items-center gap-1 text-xs"
      :class="status.class"
    >
      <UIcon
        :name="status.icon"
        class="size-3.5 shrink-0"
      />

      {{ status.text }}
    </p>
  </div>
</template>
