<script setup lang="ts">
  import type { ApiFetchError } from '~/shared/types';

  const emit = defineEmits<{
    (event: 'switch:sign-in'): void;
  }>();

  const toast = useToast();

  const state = reactive({
    email: '',
  });

  const { execute, status, error } = useFetch<
    void,
    ApiFetchError,
    '/api/auth/password/reset-request',
    'POST'
  >('/api/auth/password/reset-request', {
    body: computed(() => ({
      email: state.email,
    })),
    immediate: false,
    method: 'POST',
    retry: false,
    watch: false,
  });

  const inProgress = computed(() => status.value === 'pending');
  const success = computed(() => status.value === 'success');

  async function onSubmit() {
    await execute();

    if (error.value) {
      toast.add({
        title: 'Ошибка восстановления пароля',
        description:
          error.value.data?.message
          ?? 'Не удалось отправить письмо — попробуйте ещё раз.',
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
    <div class="flex flex-col gap-1">
      <h4 class="text-2xl font-semibold text-highlighted">
        Восстановление пароля
      </h4>

      <p class="text-sm text-muted">
        Пришлём на почту ссылку для сброса пароля
      </p>
    </div>

    <UForm
      class="flex flex-col gap-4"
      :state
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <UFormField name="email">
        <UInput
          v-model="state.email"
          class="w-full"
          size="lg"
          icon="tabler:mail"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
          placeholder="Электронная почта"
          autofocus
        />
      </UFormField>

      <UButton
        :disabled="success"
        :loading="inProgress"
        size="lg"
        block
        @click.left.exact.prevent="onSubmit"
      >
        Отправить письмо
      </UButton>
    </UForm>

    <div class="flex justify-center border-t border-default pt-5">
      <UButton
        class="p-0"
        variant="link"
        icon="tabler:arrow-left"
        @click.left.exact.prevent="$emit('switch:sign-in')"
      >
        Вернуться ко входу
      </UButton>
    </div>
  </div>
</template>
