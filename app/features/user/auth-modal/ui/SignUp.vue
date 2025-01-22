<script setup lang="ts">
  import { Form } from 'ant-design-vue';
  import { ValidationAuth } from '~/shared/utils';
  import { omit } from 'lodash-es';

  const emit = defineEmits<{
    (e: 'switch:sign-in'): void;
  }>();

  const { notification } = App.useApp();

  const success = ref(false);

  const model = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const rules = computed(() => ({
    username: [ValidationAuth.ruleUsername({ checkExist: true })],
    email: [ValidationAuth.ruleEmail({ checkExist: true })],
    password: [ValidationAuth.rulePassword()],
    repeat: [ValidationAuth.rulePasswordRepeat(model.password)],
  }));

  const { validate, validateInfos } = Form.useForm(model, rules, {
    debounce: {
      wait: 500,
    },
  });

  const { execute, status, error } = useFetch('/api/auth/sign-up', {
    body: computed(() => omit(model, 'repeat')),
    method: 'post',
    watch: false,
    retry: false,
    immediate: false,
  });

  const inProgress = computed(() => status.value === 'pending');

  const onSubmit = async () => {
    await validate();
    await execute();

    if (error.value) {
      notification.error({
        message: 'Ошибка авторизации',
        description: error.value.data.message,
      });

      return;
    }

    success.value = true;

    emit('switch:sign-in');

    notification.success({
      message: 'Регистрация прошла успешно!',
      description:
        'Пожалуйста, подтвердите почту пройдя по ссылке в письме на электронной почте. Ссылка действительна в течение суток.',
    });
  };
</script>

<template>
  <AFlex
    :gap="24"
    vertical
  >
    <ATypographyTitle :level="4"> Регистрация </ATypographyTitle>

    <AForm
      :model
      label-placement="left"
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <AFormItem v-bind="validateInfos.username">
        <AInput
          v-model:value="model.username"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          placeholder="Имя пользователя"
          autofocus
        />
      </AFormItem>

      <AFormItem v-bind="validateInfos.email">
        <AInput
          v-model:value="model.email"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
          placeholder="Электронная почта"
        />
      </AFormItem>

      <AFormItem v-bind="validateInfos.password">
        <ATooltip trigger="focus">
          <template #title>
            Допустимые спец. символы:
            {{ ValidationAuth.ALLOWED_SPECIAL_CHARACTERS.join(' ') }}
          </template>

          <template #default>
            <AInputPassword
              v-model:value="model.password"
              autocapitalize="off"
              autocomplete="new-password"
              autocorrect="off"
              type="password"
              placeholder="Пароль"
            />
          </template>
        </ATooltip>
      </AFormItem>

      <AFormItem v-bind="validateInfos.repeat">
        <AInputPassword
          v-model:value="model.repeat"
          autocapitalize="off"
          autocomplete="new-password"
          autocorrect="off"
          type="password"
          placeholder="Повторите пароль"
          show-password-on="click"
        />
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
          Зарегистрироваться
        </AButton>

        <AButton
          :disabled="inProgress"
          type="link"
          @click.left.exact.prevent="$emit('switch:sign-in')"
        >
          Есть аккаунт?
        </AButton>
      </AFlex>
    </AForm>
  </AFlex>
</template>
