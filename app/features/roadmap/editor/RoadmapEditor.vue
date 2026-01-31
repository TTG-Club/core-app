<script setup lang="ts">
  import { RoadmapPreview } from '~roadmap/preview';

  import type { RoadmapRequest } from '~roadmap/types';

  const { url = undefined } = defineProps<{
    url?: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:roadmap'): void;
  }>();

  const $toast = useToast();

  const opened = ref(false);

  const state = ref<RoadmapRequest>(getDefaultState());

  function reset() {
    state.value = getDefaultState();
  }

  function getDefaultState(): RoadmapRequest {
    return {
      name: '',
      preview: '',
      description: undefined,
      visible: false,
    };
  }

  async function submit() {
    try {
      await $fetch(`/api/v2/roadmap${url ? `/${url}` : ''}`, {
        method: url ? 'PUT' : 'POST',
        body: unref(state),
      });

      emit('update:roadmap');

      opened.value = false;
    } catch (error) {
      $toast.add({
        color: 'error',
        title: 'Какая-то ошибка...',
      });

      consola.error(error);
    }
  }

  whenever(opened, async () => {
    reset();

    if (url) {
      state.value =
        (await $fetch<RoadmapRequest>(`/api/v2/roadmap/${url}/raw`)) ||
        getDefaultState();
    }
  });
</script>

<template>
  <UModal
    v-model:open="opened"
    :title="url ? 'Редактирование' : 'Создание'"
  >
    <template #default>
      <slot name="default" />
    </template>

    <template #body>
      <UForm
        :state
        class="flex flex-col gap-4"
      >
        <UFormField
          label="Название"
          name="name"
          required
        >
          <UInput v-model="state.name" />
        </UFormField>

        <UFormField
          label="Краткое описание"
          name="preview"
          required
        >
          <UTextarea v-model="state.preview" />
        </UFormField>

        <UFormField
          label="Описание"
          name="description"
        >
          <UTextarea v-model="state.description" />
        </UFormField>

        <UFormField
          label="Видимость пользователям"
          name="visible"
        >
          <UCheckbox
            v-model="state.visible"
            label="Да"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        label="Сохранить"
        @click.left.exact.prevent="submit"
      />

      <RoadmapPreview :state="state" />
    </template>
  </UModal>
</template>
