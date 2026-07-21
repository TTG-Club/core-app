<script setup lang="ts">
  import type { AdminDisplayNameMatch } from '../model';

  import { ADMIN_USERS_NAME_MATCHES_LABEL } from '../model';

  defineProps<{
    matches: AdminDisplayNameMatch[];
  }>();

  const emit = defineEmits<{
    select: [login: string];
  }>();

  /**
   * Подставляет логин найденного по имени пользователя в поиск.
   */
  function select(login: string): void {
    emit('select', login);
  }
</script>

<template>
  <div
    class="flex flex-col gap-1.5 rounded-xl border border-default bg-elevated/50 p-3"
  >
    <span class="text-[10px] font-medium tracking-wider text-muted uppercase">
      {{ ADMIN_USERS_NAME_MATCHES_LABEL }}
    </span>

    <button
      v-for="match in matches"
      :key="match.login"
      type="button"
      class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-default/60"
      @click.left.exact.prevent="select(match.login)"
    >
      <UIcon
        name="tabler:user-search"
        class="size-4 shrink-0 text-muted"
        aria-hidden="true"
      />

      <span class="truncate text-sm text-highlighted">
        {{ match.displayName }}
      </span>

      <span class="truncate text-xs text-muted">@{{ match.login }}</span>
    </button>
  </div>
</template>
