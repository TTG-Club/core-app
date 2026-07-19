<script setup lang="ts">
  import {
    COMMENTS_LOGIN_NOTE_BUTTON_LABEL,
    COMMENTS_LOGIN_NOTE_TEXT,
  } from '../../model';

  const emit = defineEmits<{
    login: [];
  }>();

  function login(): void {
    emit('login');
  }
</script>

<template>
  <!--
    Одна строка: иконка, текст и вход. Блок стоит на месте формы отправки,
    поэтому по высоте держится ближе к ней, чем к карточке-баннеру. На узком
    экране кнопка переносится вниз — текст ужимать до многоточия нельзя.
  -->
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-default bg-elevated px-3 py-2"
  >
    <UIcon
      name="tabler:message-circle"
      class="size-5 shrink-0 text-muted"
    />

    <p class="flex-1 text-sm text-muted">
      {{ COMMENTS_LOGIN_NOTE_TEXT }}
    </p>

    <UButton
      size="sm"
      icon="tabler:user"
      @click.left.exact.prevent="login"
    >
      {{ COMMENTS_LOGIN_NOTE_BUTTON_LABEL }}
    </UButton>
  </div>
</template>
