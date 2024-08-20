<script setup lang="ts">
  defineEmits<{
    (e: 'switch:sign-up' | 'switch:change-password'): void;
  }>();

  const success = ref(false);
  const inProgress = ref(false);

  const model = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const noSideSpace = (value: string) => !/ /.test(value);

  const onSubmit = () => {};
</script>

<template>
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
        :allow-input="noSideSpace"
      />
    </AFormItem>

    <AFormItem
      size="large"
      path="password"
    >
      <AInput
        v-model:value="model.password"
        autocapitalize="off"
        autocomplete="current-password"
        autocorrect="off"
        type="password"
        placeholder="Пароль"
        show-password-on="click"
        :allow-input="noSideSpace"
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
        :disabled="success"
        :loading="inProgress"
        type="primary"
        @click.left.exact.prevent="onSubmit"
      >
        Вход
      </AButton>

      <AButton
        type="link"
        @click.left.exact.prevent="$emit('switch:sign-up')"
      >
        Регистрация
      </AButton>

      <AButton
        type="link"
        @click.left.exact.prevent="$emit('switch:change-password')"
      >
        Забыли пароль?
      </AButton>
    </AFlex>
  </AForm>
</template>
