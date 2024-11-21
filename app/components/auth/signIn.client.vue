<script setup lang="ts">
  const emit = defineEmits<{
    (e: 'switch:sign-up' | 'switch:change-password' | 'close'): void;
  }>();

  const success = ref(false);

  const model = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const showSuccessNotify = () => {
    notification.success({
      key: 'notify-sign-in',
      message: 'Вы авторизовались!',
    });
  };

  const { execute, status, error } = useApi('/auth/sign-in', {
    body: computed(() => model),
    method: 'post',
    watch: false,
    retry: false,
    immediate: false,
  });

  const inProgress = computed(() => status.value === 'pending');

  const onSubmit = async () => {
    await execute();

    if (error.value) {
      return;
    }

    success.value = true;

    emit('close');
    showSuccessNotify();
  };
</script>

<template>
  <AFlex
    :gap="24"
    vertical
  >
    <ATypographyTitle :level="4"> Авторизация </ATypographyTitle>

    <AForm
      :model
      label-placement="left"
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <AFormItem
        size="large"
        path="usernameOrEmail"
      >
        <AInput
          v-model:value="model.usernameOrEmail"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          placeholder="Логин или электронная почта"
          autofocus
        />
      </AFormItem>

      <AFormItem
        size="large"
        path="password"
      >
        <AInputPassword
          v-model:value="model.password"
          autocapitalize="off"
          autocomplete="current-password"
          autocorrect="off"
          type="password"
          placeholder="Пароль"
        />
      </AFormItem>

      <AFormItem>
        <ACheckbox v-model:checked="model.remember"> Запомнить меня </ACheckbox>
      </AFormItem>

      <AFlex
        :gap="8"
        :vertical="false"
      >
        <AButton
          :loading="inProgress"
          :disabled="success"
          type="primary"
          @click.left.exact.prevent="onSubmit"
        >
          Вход
        </AButton>

        <AButton
          :disabled="inProgress"
          type="link"
          @click.left.exact.prevent="$emit('switch:sign-up')"
        >
          Регистрация
        </AButton>

        <AButton
          :disabled="inProgress"
          type="link"
          @click.left.exact.prevent="$emit('switch:change-password')"
        >
          Забыли пароль?
        </AButton>
      </AFlex>
    </AForm>
  </AFlex>
</template>
