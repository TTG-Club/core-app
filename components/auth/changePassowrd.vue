<script setup lang="ts">
  defineEmits<{
    (e: 'switch:sign-in'): void;
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
  <ATypographyTitle :level="4"> Изменение пароля </ATypographyTitle>

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
        Изменить пароль
      </AButton>

      <AButton
        type="link"
        @click.left.exact.prevent="$emit('switch:sign-in')"
      >
        Авторизация
      </AButton>
    </AFlex>
  </AForm>
</template>
