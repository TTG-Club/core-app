<script setup lang="ts">
  import type { CreateNexusRequest } from '../model';

  import {
    NEXUS_CREATE_LABEL,
    NEXUS_CREATE_TITLE,
    NEXUS_LIST_DESCRIPTION,
    NEXUS_TITLE_LABEL,
    NEXUS_TITLE_MAX_LENGTH,
    NEXUS_TITLE_PLACEHOLDER,
  } from '../model';

  /**
   * Новая комната. Кроме названия спрашивать нечего: состав набирается
   * ссылкой, а всё остальное настраивается уже внутри.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { loading = false } = defineProps<{
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreateNexusRequest];
  }>();

  const title = ref('');

  const isValid = computed(() => !!title.value.trim());

  // Окно живёт вместе со страницей: чистим поле на каждом открытии, иначе
  // прошлое название подставится в следующую комнату.
  watch(isOpen, (opened) => {
    if (opened) {
      title.value = '';
    }
  });

  /** Отправляет название новой комнаты. */
  function submit(): void {
    if (isValid.value) {
      emit('submit', { title: title.value.trim() });
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="NEXUS_CREATE_TITLE"
    :description="NEXUS_LIST_DESCRIPTION"
  >
    <template #body>
      <UFormField
        :label="NEXUS_TITLE_LABEL"
        required
      >
        <UInput
          v-model="title"
          autofocus
          :maxlength="NEXUS_TITLE_MAX_LENGTH"
          :placeholder="NEXUS_TITLE_PLACEHOLDER"
          class="w-full"
          @keyup.enter="submit"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          label="Отмена"
          @click.left.exact.prevent="isOpen = false"
        />

        <UButton
          icon="tabler:plus"
          :loading="loading"
          :disabled="!isValid"
          :label="NEXUS_CREATE_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
