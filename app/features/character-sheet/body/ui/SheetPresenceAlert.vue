<script setup lang="ts">
  import type { SheetPresenceUser } from '../../model';

  import { SHEET_PRESENCE_LABELS } from '../../model';

  /**
   * Предупреждение мягкой блокировки: лист сейчас открыт ещё у кого-то из тех,
   * кто может его править. Ничего не запрещает — только просит править по
   * очереди, пока сохранение не упёрлось в конфликт версий.
   */
  const { users } = defineProps<{
    /** Другие пользователи, у которых лист открыт; пусто — предупреждения нет. */
    users: SheetPresenceUser[];
  }>();

  const title = computed(
    () =>
      `${SHEET_PRESENCE_LABELS.titlePrefix}: ${users.map((user) => user.displayName).join(', ')}`,
  );
</script>

<template>
  <UAlert
    v-if="users.length"
    icon="tabler:users"
    color="warning"
    variant="subtle"
    :title
    :description="SHEET_PRESENCE_LABELS.description"
  />
</template>
