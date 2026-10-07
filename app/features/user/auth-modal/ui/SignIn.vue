<script setup lang="ts">
  import type { ApiFetchError } from '~/shared/types';

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

  const { execute, status, error } = useFetch<
    void,
    ApiFetchError,
    '/api/auth/sign-in',
    'post'
  >('/api/auth/sign-in', {
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
        description:
          error.value.data?.message ?? 'Не удалось войти — попробуйте ещё раз.',
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
    <div class="flex flex-col gap-1">
      <h4 class="text-2xl font-semibold text-highlighted">Вход</h4>

      <p class="text-sm text-muted">Рады видеть вас снова</p>
    </div>

    <UForm
      class="flex flex-col gap-4"
      :state
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <UFormField path="usernameOrEmail">
        <UInput
          v-model="state.usernameOrEmail"
          class="w-full"
          size="lg"
          icon="tabler:user"
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
          class="w-full"
          size="lg"
          icon="tabler:lock"
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

      <div class="flex items-center justify-between gap-3">
        <UCheckbox
          v-model="state.remember"
          label="Запомнить меня"
          default-value
        />

        <UButton
          class="p-0"
          variant="link"
          :disabled="inProgress"
          @click.left.exact.prevent="$emit('switch:change-password')"
        >
          Забыли пароль?
        </UButton>
      </div>

      <UButton
        :disabled="inProgress"
        :loading="inProgress"
        size="lg"
        block
        @click.left.exact.prevent="onSubmit"
      >
        Войти
      </UButton>
    </UForm>

    <div
      class="flex flex-wrap items-center justify-center gap-x-2 border-t border-default pt-5 text-sm text-muted"
    >
      Ещё нет аккаунта?

      <UButton
        class="p-0"
        variant="link"
        :disabled="inProgress"
        @click.left.exact.prevent="$emit('switch:sign-up')"
      >
        Зарегистрироваться
      </UButton>
    </div>
  </div>
</template>
