<script setup lang="ts">
  const emit = defineEmits<{
    (event: 'switch:sign-in'): void;
  }>();

  const toast = useToast();

  const state = reactive({
    email: '',
  });

  const { execute, status, error } = useFetch(
    '/api/auth/password/reset-request',
    {
      body: computed(() => ({
        email: state.email,
      })),
      immediate: false,
      method: 'POST',
      retry: false,
      watch: false,
    },
  );

  const inProgress = computed(() => status.value === 'pending');
  const success = computed(() => status.value === 'success');

  async function onSubmit() {
    await execute();

    if (error.value) {
      toast.add({
        title: 'Ошибка восстановления пароля',
        description: error.value.data.message,
        color: 'error',
        icon: 'tabler:user-exclamation',
      });

      return;
    }

    toast.add({
      title: 'Письмо отправлено',
      description:
        'Если почта есть в системе, мы отправили ссылку для сброса пароля.',
      color: 'success',
      icon: 'tabler:mail-check',
    });

    emit('switch:sign-in');
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <h4 class="text-2xl">Восстановление пароля</h4>

    <UForm
      class="flex flex-col gap-4"
      :state
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <UFormField name="email">
        <UInput
          v-model="state.email"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
          placeholder="Электронная почта"
          autofocus
        />
      </UFormField>

      <div class="flex flex-col gap-2 md:flex-row">
        <UButton
          :disabled="success"
          :loading="inProgress"
          class="md:w-auto"
          block
          @click.left.exact.prevent="onSubmit"
        >
          Отправить письмо
        </UButton>

        <UButton
          class="md:w-auto"
          variant="soft"
          block
          @click.left.exact.prevent="$emit('switch:sign-in')"
        >
          Авторизация
        </UButton>
      </div>
    </UForm>
  </div>
</template>
