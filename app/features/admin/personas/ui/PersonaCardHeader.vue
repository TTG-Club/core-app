<script setup lang="ts">
  import type { PersonaResponse } from '../model';

  import { FetchError } from 'ofetch';

  const { persona } = defineProps<{
    persona: PersonaResponse;
  }>();

  const emit = defineEmits<{
    'edit-name': [];
    'edited': [];
    'deleted': [];
  }>();

  const toast = useToast();
  const isDeleting = ref(false);
  const isConfirmDeleteOpen = ref(false);

  const formattedDate = computed(
    () => useDateFormat(persona.createdAt, 'DD.MM.YYYY').value,
  );

  async function togglePersonaState(isActive: boolean) {
    try {
      await $fetch(`/api/v2/persona/${persona.id}`, {
        method: 'PATCH',
        body: { disabled: !isActive },
      });

      emit('edited');
    } catch (error) {
      const message =
        error instanceof FetchError
          ? error.data?.message || error.message
          : 'Неизвестная ошибка';

      toast.add({
        title: 'Не удалось изменить состояние',
        description: message,
        color: 'error',
      });
    }
  }

  async function deletePersona() {
    isDeleting.value = true;

    try {
      await $fetch(`/api/v2/persona/${persona.id}`, {
        method: 'DELETE',
      });

      toast.add({ title: 'Персона удалена', color: 'success' });
      emit('deleted');
    } catch (error) {
      const message =
        error instanceof FetchError
          ? error.data?.message || error.message
          : 'Неизвестная ошибка';

      toast.add({
        title: 'Ошибка при удалении',
        description: message,
        color: 'error',
      });
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Подтверждает удаление персоны и запускает процесс удаления.
   */
  async function confirmDelete() {
    isConfirmDeleteOpen.value = false;
    await deletePersona();
  }
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <USwitch
        size="sm"
        :model-value="!persona.disabled"
        @update:model-value="togglePersonaState"
      />

      <div class="group flex items-center gap-1">
        <h3 class="text-base font-semibold text-highlighted">
          {{ persona.name }}
        </h3>

        <UButton
          variant="ghost"
          size="xs"
          icon="tabler:pencil"
          color="neutral"
          class="text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100"
          @click.left.exact.prevent="$emit('edit-name')"
        />
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-sm text-neutral-500">
        {{ persona.username }} · {{ formattedDate }}
      </span>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        :loading="isDeleting"
        @click.left.exact.prevent="isConfirmDeleteOpen = true"
      />
    </div>
  </div>

  <!-- Модальное окно подтверждения удаления персоны -->
  <UModal
    v-model:open="isConfirmDeleteOpen"
    title="Удалить персону?"
    :description="`Вы действительно хотите удалить персону «${persona.name}»?`"
  >
    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="isConfirmDeleteOpen = false"
        >
          Отмена
        </UButton>

        <UButton
          color="error"
          :loading="isDeleting"
          @click.left.exact.prevent="confirmDelete"
        >
          Удалить
        </UButton>
      </div>
    </template>
  </UModal>
</template>
