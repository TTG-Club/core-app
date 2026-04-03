<script setup lang="ts">
  import type { PersonaResponse } from '../model';

  import { FetchError } from 'ofetch';

  const props = withDefaults(
    defineProps<{
      persona?: PersonaResponse | null;
      isEditing: boolean;
    }>(),
    { persona: null },
  );

  const isOpen = defineModel<boolean>('open', { required: true });

  const emit = defineEmits<{
    saved: [];
  }>();

  const personaNameInput = ref('');
  const isSaving = ref(false);
  const toast = useToast();

  const modalTitle = computed(() =>
    props.isEditing ? 'Редактирование' : 'Новая персона',
  );

  const modalDescription = computed(() =>
    props.isEditing ? 'Измените имя персоны' : 'Введите имя для новой персоны',
  );

  watch(isOpen, (opened) => {
    if (opened) {
      personaNameInput.value = props.persona?.name ?? '';
    }
  });

  async function savePersona() {
    const trimmedName = personaNameInput.value.trim();

    if (!trimmedName) {
      return;
    }

    isSaving.value = true;

    try {
      if (props.persona) {
        await $fetch(`/api/v2/persona/${props.persona.id}`, {
          method: 'PATCH',
          body: { name: trimmedName },
        });
      } else {
        await $fetch('/api/v2/persona', {
          method: 'POST',
          body: {
            name: trimmedName,
            image: '',
            disabled: false,
          },
        });
      }

      isOpen.value = false;

      toast.add({
        title: props.isEditing ? 'Персона обновлена' : 'Персона создана',
        color: 'success',
      });

      emit('saved');
    } catch (error) {
      let errorMessage = 'Неизвестная ошибка';

      if (error instanceof FetchError) {
        errorMessage = error.data?.message || error.message;
      }

      toast.add({
        title: 'Ошибка при сохранении',
        description: errorMessage,
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :description="modalDescription"
  >
    <template #body>
      <div class="space-y-4">
        <UInput
          v-model="personaNameInput"
          placeholder="Введите имя персоны"
          autofocus
          @keydown.enter="savePersona"
        />

        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click.left.exact.prevent="isOpen = false"
          >
            Отмена
          </UButton>

          <UButton
            :disabled="!personaNameInput.trim()"
            :loading="isSaving"
            @click.left.exact.prevent="savePersona"
          >
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
