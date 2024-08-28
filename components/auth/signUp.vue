<script setup lang="ts">
  import { Form } from 'ant-design-vue';
  import {
    ALLOWED_SPECIAL_CHARACTERS,
    ruleEmail,
    rulePassword,
    rulePasswordRepeat,
    ruleUsername,
  } from '~/utils/validation/auth';
  import { AButton, AFlex } from '#components';
  import { omit } from 'lodash-es';

  const emit = defineEmits<{
    (e: 'switch:sign-in'): void;
  }>();

  const success = ref(false);

  const model = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const rules = computed(() => ({
    username: [ruleUsername({ checkExist: true })],
    email: [ruleEmail({ checkExist: true })],
    password: [rulePassword()],
    repeat: [rulePasswordRepeat(model.password)],
  }));

  const { validate, validateInfos } = Form.useForm(model, rules, {
    debounce: {
      wait: 500,
    },
  });

  const showSuccessNotify = () => {
    notification.success({
      key: 'notify-sign-up',
      message: 'Регистрация прошла успешно!',
      description:
        'Пожалуйста, подтвердите почту пройдя по ссылке в письме на электронной почте. Ссылка действительна в течение суток.',
    });
  };

  const { execute, status, error } = useApi('/auth/sign-up', {
    body: computed(() => omit(model, 'repeat')),
  });

  const inProgress = computed(() => status.value === 'pending');

  const onSubmit = async () => {
    await validate();
    await execute();

    if (error.value) {
      return;
    }

    success.value = true;

    emit('switch:sign-in');
    showSuccessNotify();
  };
</script>

<template>
  <ATypographyTitle :level="4"> Регистрация </ATypographyTitle>

  <AForm
    :model
    :style="{ marginTop: '8px' }"
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
          Допустимые спец. символы: {{ ALLOWED_SPECIAL_CHARACTERS.join(' ') }}
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
</template>
