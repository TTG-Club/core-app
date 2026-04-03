<script setup lang="ts">
  import type {
    NotificationTypeOption,
    PersonaResponse,
  } from '~/features/admin/personas/model';

  import { PersonaCard, PersonaModal } from '~/features/admin/personas/ui';

  useSeoMeta({
    title: 'Персоны: Настройки',
  });

  const { data: personas, refresh } = await useAsyncData<PersonaResponse[]>(
    'admin-personas',
    () => $fetch('/api/v2/persona'),
    { default: () => [] },
  );

  const { data: notificationTypeOptions } = await useAsyncData<
    NotificationTypeOption[]
  >(
    'admin-notification-types',
    () => $fetch('/api/v2/dictionaries/notification/types'),
    {
      default: () => [],
    },
  );

  const isModalOpen = ref(false);
  const editingPersona = ref<PersonaResponse | null>(null);

  function openAddModal() {
    editingPersona.value = null;
    isModalOpen.value = true;
  }

  function openEditModal(persona: PersonaResponse) {
    editingPersona.value = persona;
    isModalOpen.value = true;
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Персоны: Настройки"
  >
    <div class="space-y-6">
      <UButton
        icon="tabler:plus"
        @click.left.exact.prevent="openAddModal"
      >
        Добавить
      </UButton>

      <PersonaModal
        v-model:open="isModalOpen"
        :persona="editingPersona"
        @saved="refresh()"
      />

      <PersonaCard
        v-for="persona in personas"
        :key="persona.id"
        :persona="persona"
        :notification-types="notificationTypeOptions || []"
        @edit-name="openEditModal(persona)"
        @edited="refresh()"
        @deleted="refresh()"
      />

      <div
        v-if="!personas?.length"
        class="py-8 text-center text-neutral-500"
      >
        Список персон пуст
      </div>
    </div>
  </NuxtLayout>
</template>
