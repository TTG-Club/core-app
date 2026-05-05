<script setup lang="ts">
  const emit = defineEmits<{
    (event: 'switch:sign-up' | 'switch:change-password' | 'close'): void;
  }>();

  const {
    error: profileError,
    fetch: fetchProfile,
    pending: profilePending,
  } = useUser();

  const $toast = useToast();

  const showPwd = ref(false);

  const state = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const { execute, status, error } = useFetch('/api/auth/sign-in', {
    body: computed(() => ({
      login: state.usernameOrEmail,
      password: state.password,
    })),
    method: 'post',
    watch: false,
    retry: false,
    immediate: false,
  });

  const inProgress = computed(
    () => status.value === 'pending' || profilePending.value,
  );

  async function onSubmit() {
    await execute();

    if (error.value) {
      $toast.add({
        title: 'Ошибка авторизации',
        description: error.value.data.message,
        color: 'error',
        icon: 'tabler:user-exclamation',
      });

      return;
    }

    await fetchProfile();

    if (profileError.value) {
      $toast.add({
        title: 'Ошибка авторизации',
        description: 'Не удалось загрузить профиль. Попробуйте еще раз.',
        color: 'error',
        icon: 'tabler:user-exclamation',
      });

      return;
    }

    emit('close');

    $toast.add({
      title: 'Вы авторизовались!',
      color: 'success',
      icon: 'tabler:user-check',
    });
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <h4 class="text-2xl">Авторизация</h4>

    <UForm
      class="flex flex-col gap-4"
      :state
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <UFormField path="usernameOrEmail">
        <UInput
          v-model="state.usernameOrEmail"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          placeholder="Логин или электронная почта"
          autofocus
        />
      </UFormField>

      <UFormField path="password">
        <UInput
          v-model="state.password"
          autocapitalize="off"
          autocomplete="current-password"
          autocorrect="off"
          placeholder="Пароль"
          :type="showPwd ? 'text' : 'password'"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPwd ? 'tabler:eye-off' : 'tabler:eye-filled'"
              :aria-label="showPwd ? 'Скрыть пароль' : 'Показать пароль'"
              :aria-pressed="showPwd"
              aria-controls="password"
              @click.left.exact.prevent="showPwd = !showPwd"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField>
        <UCheckbox
          v-model="state.remember"
          label="Запомнить меня"
          default-value
        />
      </UFormField>

      <div class="flex flex-col gap-2 md:flex-row">
        <UButton
          :disabled="inProgress"
          :loading="inProgress"
          class="md:w-auto"
          block
          @click.left.exact.prevent="onSubmit"
        >
          Вход
        </UButton>

        <UButton
          :disabled="inProgress"
          class="md:w-auto"
          variant="soft"
          block
          @click.left.exact.prevent="$emit('switch:sign-up')"
        >
          Регистрация
        </UButton>

        <UButton
          class="md:w-auto"
          variant="soft"
          :disabled="inProgress"
          block
          @click.left.exact.prevent="$emit('switch:change-password')"
        >
          Забыли пароль?
        </UButton>
      </div>
    </UForm>
  </div>
</template>
