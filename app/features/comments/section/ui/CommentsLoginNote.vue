<script setup lang="ts">
  const emit = defineEmits<{
    login: [];
  }>();

  function login(): void {
    emit('login');
  }
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-lg border border-default bg-elevated px-4 py-6 text-center sm:flex-row sm:text-left"
  >
    <UIcon
      name="tabler:message-circle"
      class="size-8 shrink-0 text-muted"
    />

    <div class="flex flex-1 flex-col gap-0.5">
      <p class="text-sm font-medium text-highlighted">
        Обсуждение доступно после входа
      </p>

      <p class="text-sm text-muted">
        Войдите, чтобы читать комментарии и участвовать в обсуждении.
      </p>
    </div>

    <UButton
      icon="tabler:user"
      @click.left.exact.prevent="login"
    >
      Войти
    </UButton>
  </div>
</template>
