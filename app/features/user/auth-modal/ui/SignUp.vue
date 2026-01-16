<script setup lang="ts">
  import { omit } from 'lodash-es';

  const emit = defineEmits<{
    (e: 'switch:sign-in'): void;
  }>();

  const $toast = useToast();
  const passwordField = useTemplateRef<HTMLDivElement>('passwordField');
  const { focused } = useFocusWithin(passwordField);

  const ALLOWED_SPECIAL_CHARACTERS = [
    "'",
    '-',
    '!',
    '"',
    '#',
    '$',
    '%',
    '&',
    '(',
    ')',
    '*',
    ',',
    '.',
    '/',
    ':',
    ';',
    '?',
    '@',
    '[',
    ']',
    '^',
    '_',
    '`',
    '{',
    '|',
    '}',
    '~',
    '+',
    '<',
    '=',
    '>',
  ];

  const charList = ALLOWED_SPECIAL_CHARACTERS.join(' ');

  const success = ref(false);
  const showPwd = ref(false);
  const showPwdRepeat = ref(false);

  const state = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const { execute, status, error } = useFetch('/api/auth/sign-up', {
    body: computed(() => omit(state, 'repeat')),
    method: 'post',
    watch: false,
    retry: false,
    immediate: false,
  });

  const inProgress = computed(() => status.value === 'pending');

  async function onSubmit() {
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
  }
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
      <UFormField name="username">
        <UInput
          v-model="state.username"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          placeholder="Имя пользователя"
          autofocus
        />
      </UFormField>

      <UFormField name="email">
        <UInput
          v-model="state.email"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
          placeholder="Электронная почта"
        />
      </UFormField>

      <UFormField name="password">
        <UPopover
          :content="{ side: 'top' }"
          :open="focused"
          :ui="{ content: 'text-center' }"
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
        </UPopover>
      </UFormField>

      <UFormField name="repeat">
        <UInput
          v-model="state.repeat"
          autocapitalize="off"
          autocomplete="new-password"
          autocorrect="off"
          placeholder="Повторите пароль"
          :type="showPwdRepeat ? 'text' : 'password'"
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
              @click.left.exact.prevent="showPwdRepeat = !showPwdRepeat"
            />
          </template>
        </UInput>
      </UFormField>

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
