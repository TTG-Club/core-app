<script setup lang="ts">
  import type { NotificationAdminResponse, PersonaResponse } from '../model';

  import PersonaAvatar from './PersonaAvatar.vue';
  import PersonaCardHeader from './PersonaCardHeader.vue';
  import PersonaNotificationDrawer from './PersonaNotificationDrawer.vue';
  import PersonaNotificationList from './PersonaNotificationList.vue';

  const { persona } = defineProps<{
    persona: PersonaResponse;
  }>();

  defineEmits<{
    'edit-name': [];
    'edited': [];
    'deleted': [];
  }>();

  const isDrawerOpen = ref(false);
  const activeNotification = ref<NotificationAdminResponse | null>(null);
  const isEditingNotification = computed(() => !!activeNotification.value);

  function openAddDrawer() {
    activeNotification.value = null;
    isDrawerOpen.value = true;
  }

  function openEditDrawer(notification: NotificationAdminResponse) {
    activeNotification.value = notification;
    isDrawerOpen.value = true;
  }

  async function onNotificationSaved() {
    await refreshNuxtData(`persona-notifications-${persona.id}`);
  }
</script>

<template>
  <div
    class="space-y-4 rounded-lg border border-default p-4 transition-opacity"
    :class="{ 'opacity-60': persona.disabled }"
  >
    <PersonaCardHeader
      :persona="persona"
      @edit-name="$emit('edit-name')"
      @edited="$emit('edited')"
      @deleted="$emit('deleted')"
    />

    <div class="grid grid-cols-[1fr_auto] gap-6">
      <PersonaNotificationList
        :persona-id="persona.id"
        @add-notification="openAddDrawer"
        @edit-notification="openEditDrawer"
      />

      <PersonaAvatar
        :persona="persona"
        @edited="$emit('edited')"
      />
    </div>

    <PersonaNotificationDrawer
      v-model:open="isDrawerOpen"
      :persona="persona"
      :notification="activeNotification"
      :is-editing="isEditingNotification"
      @saved="onNotificationSaved"
    />
  </div>
</template>
