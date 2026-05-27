<script setup lang="ts">
  import { BUG_REPORT_ANONYMOUS_USER } from '../../model';

  const { user, isLoggedIn } = useUser();

  const authorName = computed(() =>
    isLoggedIn.value && user.value
      ? user.value.username
      : BUG_REPORT_ANONYMOUS_USER,
  );

  const authorIcon = computed(() =>
    isLoggedIn.value ? 'tabler:user-check' : 'tabler:user-question',
  );
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2 text-highlighted">
      <UIcon
        :name="authorIcon"
        class="size-5 shrink-0"
      />

      <span class="text-sm leading-5">
        Автор: <strong>{{ authorName }}</strong>
      </span>
    </div>

    <p
      v-if="!isLoggedIn"
      class="m-0 pl-7 text-xs leading-4 text-muted"
    >
      Авторизуйтесь, чтобы отслеживать статус вашего репорта
    </p>
  </div>
</template>
