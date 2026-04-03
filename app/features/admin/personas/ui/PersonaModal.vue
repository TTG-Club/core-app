<script setup lang="ts">
  import type { PersonaResponse } from '../model';

  const props = defineProps<{
    persona?: PersonaResponse | null;
  }>();

  const isOpen = defineModel<boolean>('open', { required: true });

  const emit = defineEmits<{
    saved: [];
  }>();

  const personaNameInput = ref('');
  const isSaving = ref(false);

  const toast = useToast();
  const { user } = useUser();

  const isEditing = computed(() => !!props.persona);

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
          method: 'PUT',
          body: {
            ...props.persona,
            name: trimmedName,
          },
        });
      } else {
        await $fetch('/api/v2/persona', {
          method: 'POST',
          body: {
            name: trimmedName,
            image: '',
            disabled: false,
            username: user.value?.username || '',
          },
        });
      }

      isOpen.value = false;

      toast.add({
        title: isEditing.value ? 'Персона обновлена' : 'Персона создана',
        color: 'success',
      });

      emit('saved');
    } catch (error) {
      consola.error('Failed to save persona:', error);
      toast.add({ title: 'Ошибка при сохранении', color: 'error' });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Редактирование' : 'Новая персона'"
    :description="
      isEditing ? 'Измените имя персоны' : 'Введите имя для новой персоны'
    "
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
