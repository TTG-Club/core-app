<script setup lang="ts">
  defineEmits<{
    (e: 'switch:sign-in'): void;
  }>();

  const success = ref(false);
  const inProgress = ref(false);

  const model = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const noSideSpace = (value: string) => !/ /.test(value);

  const onSubmit = () => {};
</script>

<template>
  <ATypographyTitle :level="4"> Регистрация </ATypographyTitle>

  <AForm
    :model
    label-placement="left"
    @submit.prevent.stop="onSubmit"
    @keyup.enter.exact.prevent.stop="onSubmit"
  >
    <AFormItem
      size="large"
      path="username"
    >
      <AInput
        v-model:value="model.username"
        autocapitalize="off"
        autocomplete="username"
        autocorrect="off"
        placeholder="Имя пользователя"
        autofocus
        :allow-input="noSideSpace"
      />
    </AFormItem>

    <AFormItem
      size="large"
      path="email"
    >
      <AInput
        v-model:value="model.email"
        autocapitalize="off"
        autocomplete="email"
        autocorrect="off"
        placeholder="Электронная почта"
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
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Пароль"
        show-password-on="click"
        :allow-input="noSideSpace"
      />
    </AFormItem>

    <AFormItem
      size="large"
      path="repeat"
    >
      <AInput
        v-model:value="model.password"
        autocapitalize="off"
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Повторите пароль"
        show-password-on="click"
        :allow-input="noSideSpace"
      />
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
        Зарегистрироваться
      </AButton>

      <AButton
        type="link"
        @click.left.exact.prevent="$emit('switch:sign-in')"
      >
        Есть аккаунт?
      </AButton>
    </AFlex>
  </AForm>
</template>
