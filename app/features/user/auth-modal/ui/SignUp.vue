<script setup lang="ts">
  import { Form } from 'ant-design-vue';
  import { omit } from 'lodash-es';

  import { ValidationAuth } from '~/shared/utils';

  const emit = defineEmits<{
    (e: 'switch:sign-in'): void;
  }>();

  const $toast = useToast();
  const passwordField = useTemplateRef<HTMLDivElement>('passwordField');
  const { focused } = useFocusWithin(passwordField);
  const charList = ValidationAuth.allowedSpecialCharacters.join(' ');

  const success = ref(false);
  const showPwd = ref(false);
  const showPwdRepeat = ref(false);

  const state = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const rules = computed(() => ({
    username: [ValidationAuth.ruleUsername({ checkExist: true })],
    email: [ValidationAuth.ruleEmail({ checkExist: true })],
    password: [ValidationAuth.rulePassword()],
    repeat: [ValidationAuth.rulePasswordRepeat(state.password)],
  }));

  const { validate, validateInfos } = Form.useForm(state, rules, {
    debounce: {
      wait: 500,
    },
  });

  const { execute, status, error } = useFetch('/api/auth/sign-up', {
    body: computed(() => omit(state, 'repeat')),
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
      $toast.add({
        title: 'Ошибка регистрации',
        description: error.value.data.message,
        color: 'error',
        icon: 'i-fluent-person-warning-16-regular',
      });

      return;
    }

    success.value = true;

    emit('switch:sign-in');

    $toast.add({
      title: 'Регистрация прошла успешно!',
      description:
        'Пожалуйста, подтвердите почту пройдя по ссылке в письме на электронной почте. Ссылка действительна в течение суток.',
      color: 'success',
      icon: 'i-fluent-person-available-16-regular',
    });
  };
</script>

<template>
  <div class="flex flex-col gap-6">
    <h4 class="text-2xl">Регистрация</h4>

    <UForm
      class="flex flex-col gap-4"
      :state
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <AFormItem v-bind="validateInfos.username">
        <UInput
          v-model="state.username"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          placeholder="Имя пользователя"
          autofocus
        />
      </AFormItem>

      <AFormItem v-bind="validateInfos.email">
        <UInput
          v-model="state.email"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
          placeholder="Электронная почта"
        />
      </AFormItem>

      <AFormItem v-bind="validateInfos.password">
        <UPopover
          :content="{ side: 'top' }"
          :open="focused"
          :ui="{
            content:
              'w-(--reka-popper-anchor-width) py-2 px-4 text-xs text-highlighted text-center flex flex-col gap-2',
          }"
        >
          <template #content>
            <p>Допустимые спец. символы:</p>

            <p>{{ charList }}</p>
          </template>

          <UInput
            ref="passwordField"
            v-model="state.password"
            autocapitalize="off"
            autocomplete="new-password"
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
                @click="showPwd = !showPwd"
              />
            </template>
          </UInput>
        </UPopover>
      </AFormItem>

      <AFormItem v-bind="validateInfos.repeat">
        <UInput
          v-model="state.repeat"
          autocapitalize="off"
          autocomplete="new-password"
          autocorrect="off"
          placeholder="Повторите пароль"
          :type="showPwdRepeat ? 'text' : 'password'"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="
                showPwdRepeat
                  ? 'i-fluent-eye-off-16-filled'
                  : 'i-fluent-eye-16-filled'
              "
              :aria-label="showPwdRepeat ? 'Скрыть пароля' : 'Показать пароль'"
              :aria-pressed="showPwdRepeat"
              aria-controls="password"
              @click="showPwdRepeat = !showPwdRepeat"
            />
          </template>
        </UInput>
      </AFormItem>

      <div class="flex flex-col gap-2 md:flex-row">
        <UButton
          :loading="inProgress"
          :disabled="success"
          class="md:w-auto"
          block
          @click.left.exact.prevent="onSubmit"
        >
          Зарегистрироваться
        </UButton>

        <UButton
          class="md:w-auto"
          variant="soft"
          block
          @click.left.exact.prevent="$emit('switch:sign-in')"
        >
          Есть аккаунт?
        </UButton>
      </div>
    </UForm>
  </div>
</template>
