<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';

  const emit = defineEmits<{
    (e: 'switch:sign-up' | 'switch:change-password' | 'close'): void;
  }>();

  const { fetch } = useUserStore();
  const $toast = useToast();

  const showPwd = ref(false);

  const state = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const { execute, status, error } = useFetch('/api/auth/sign-in', {
    body: computed(() => state),
    method: 'post',
    watch: false,
    retry: false,
    immediate: false,
  });

  const inProgress = computed(() => status.value === 'pending');

  const onSubmit = async () => {
    await execute();

    if (error.value) {
      $toast.add({
        title: 'Ошибка авторизации',
        description: error.value.data.message,
        color: 'error',
        icon: 'i-fluent-person-warning-16-regular',
      });

      return;
    }

    fetch().finally();

    emit('close');

    $toast.add({
      title: 'Вы авторизовались!',
      color: 'success',
      icon: 'i-fluent-person-available-16-regular',
    });
  };
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
              :icon="
                showPwd
                  ? 'i-fluent-eye-off-16-filled'
                  : 'i-fluent-eye-16-filled'
              "
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
          :disabled="status === 'success'"
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
          disabled
          block
          @click.left.exact.prevent="$emit('switch:change-password')"
        >
          Забыли пароль?
        </UButton>
      </div>
    </UForm>
  </div>
</template>
