<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  const route = useRoute();
  const toast = useToast();
  const tokenQuery = route.query.token;

  const passwordResetToken =
    typeof tokenQuery === 'string' && tokenQuery ? tokenQuery : '';

  if (!passwordResetToken) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const state = reactive({
    newPassword: '',
    repeatPassword: '',
  });

  const showPassword = ref(false);
  const showRepeatPassword = ref(false);

  const passwordMismatch = computed(
    () => state.repeatPassword && state.newPassword !== state.repeatPassword,
  );

  const passwordIcon = computed(() =>
    showPassword.value ? 'tabler:eye-off' : 'tabler:eye-filled',
  );

  const repeatPasswordIcon = computed(() =>
    showRepeatPassword.value ? 'tabler:eye-off' : 'tabler:eye-filled',
  );

  const passwordToggleLabel = computed(() =>
    showPassword.value ? 'Скрыть пароль' : 'Показать пароль',
  );

  const repeatPasswordToggleLabel = computed(() =>
    showRepeatPassword.value ? 'Скрыть пароль' : 'Показать пароль',
  );

  const canSubmit = computed(
    () =>
      state.newPassword.length >= 8
      && state.repeatPassword.length >= 8
      && !passwordMismatch.value,
  );

  const { execute, status, error } = useFetch(
    '/api/auth/password/reset-confirm',
    {
      body: computed(() => ({
        newPassword: state.newPassword,
        token: passwordResetToken,
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
    if (!canSubmit.value) {
      return;
    }

    await execute();

    if (error.value) {
      toast.add({
        title: 'Ошибка сброса пароля',
        description: error.value.data.message,
        color: 'error',
        icon: 'tabler:user-exclamation',
      });

      return;
    }

    toast.add({
      title: 'Пароль изменен',
      description: 'Теперь можно войти с новым паролем.',
      color: 'success',
      icon: 'tabler:user-check',
    });

    await navigateTo({ path: '/' });
  }

  function togglePasswordVisibility() {
    showPassword.value = !showPassword.value;
  }

  function toggleRepeatPasswordVisibility() {
    showRepeatPassword.value = !showRepeatPassword.value;
  }

  async function navigateToHome() {
    await navigateTo({ path: '/' });
  }
</script>

<template>
  <NuxtLayout>
    <div
      class="mx-auto flex h-full w-full max-w-sm flex-1 flex-col justify-center gap-6"
    >
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-semibold text-primary">Сброс пароля</h1>

        <p class="text-sm text-secondary">
          Введите новый пароль для вашей учетной записи.
        </p>
      </div>

      <UForm
        class="flex flex-col gap-4"
        :state
        @submit.prevent.stop="onSubmit"
        @keyup.enter.exact.prevent.stop="onSubmit"
      >
        <UFormField name="newPassword">
          <UInput
            v-model="state.newPassword"
            autocapitalize="off"
            autocomplete="new-password"
            autocorrect="off"
            placeholder="Новый пароль"
            :type="showPassword ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="passwordIcon"
                :aria-label="passwordToggleLabel"
                :aria-pressed="showPassword"
                aria-controls="new-password"
                @click.left.exact.prevent="togglePasswordVisibility"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField
          name="repeatPassword"
          :error="passwordMismatch ? 'Пароли не совпадают' : undefined"
        >
          <UInput
            v-model="state.repeatPassword"
            autocapitalize="off"
            autocomplete="new-password"
            autocorrect="off"
            placeholder="Повторите пароль"
            :type="showRepeatPassword ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="repeatPasswordIcon"
                :aria-label="repeatPasswordToggleLabel"
                :aria-pressed="showRepeatPassword"
                aria-controls="repeat-password"
                @click.left.exact.prevent="toggleRepeatPasswordVisibility"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="flex flex-col gap-2 md:flex-row">
          <UButton
            :disabled="!canSubmit || success"
            :loading="inProgress"
            class="md:w-auto"
            block
            @click.left.exact.prevent="onSubmit"
          >
            Изменить пароль
          </UButton>

          <UButton
            class="md:w-auto"
            variant="soft"
            block
            @click.left.exact.prevent="navigateToHome"
          >
            На главную
          </UButton>
        </div>
      </UForm>
    </div>
  </NuxtLayout>
</template>
