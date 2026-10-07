<script setup lang="ts">
  import type { ApiFetchError } from '~/shared/types';

  import { omit } from 'es-toolkit';

  import {
    PRIVACY_POLICY_ROUTE,
    PRIVACY_POLICY_UPDATED_AT,
  } from '~infrastructure/privacy-policy/model';
  import {
    PUBLIC_OFFER_ROUTE,
    PUBLIC_OFFER_UPDATED_AT,
  } from '~infrastructure/public-offer/model';

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
    // Согласия не отмечены заранее: человек ставит каждую галочку сам.
    offerAccepted: false,
    personalDataConsent: false,
  });

  const { execute, status, error } = useFetch<
    void,
    ApiFetchError,
    '/api/auth/sign-up',
    'post'
  >('/api/auth/sign-up', {
    // Вместе с согласиями уходят редакции документов, которые видел
    // пользователь: в базе остаётся, с чем именно он согласился.
    body: computed(() => ({
      ...omit(state, ['repeat']),
      offerVersion: PUBLIC_OFFER_UPDATED_AT,
      privacyPolicyVersion: PRIVACY_POLICY_UPDATED_AT,
    })),
    method: 'post',
    watch: false,
    retry: false,
    immediate: false,
  });

  const inProgress = computed(() => status.value === 'pending');

  const consentsGiven = computed(
    () => state.offerAccepted && state.personalDataConsent,
  );

  const submitDisabled = computed(() => success.value || !consentsGiven.value);

  async function onSubmit() {
    // Enter в поле формы обходит выключенную кнопку.
    if (!consentsGiven.value) {
      return;
    }

    await execute();

    if (error.value) {
      $toast.add({
        title: 'Ошибка регистрации',
        description:
          error.value.data?.message
          ?? 'Не удалось зарегистрироваться — попробуйте ещё раз.',
        color: 'error',
        icon: 'tabler:user-exclamation',
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
      icon: 'tabler:user-check',
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
                :icon="showPwd ? 'tabler:eye-off' : 'tabler:eye-filled'"
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
              :icon="showPwdRepeat ? 'tabler:eye-off' : 'tabler:eye-filled'"
              :aria-label="showPwdRepeat ? 'Скрыть пароля' : 'Показать пароль'"
              :aria-pressed="showPwdRepeat"
              aria-controls="password"
              @click.left.exact.prevent="showPwdRepeat = !showPwdRepeat"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField name="offerAccepted">
        <UCheckbox v-model="state.offerAccepted">
          <template #label>
            Принимаю условия

            <ULink
              :to="PUBLIC_OFFER_ROUTE"
              target="_blank"
              class="text-primary"
            >
              публичной оферты
            </ULink>
          </template>
        </UCheckbox>
      </UFormField>

      <UFormField name="personalDataConsent">
        <UCheckbox v-model="state.personalDataConsent">
          <template #label>
            Даю согласие на обработку персональных данных в соответствии с

            <ULink
              :to="PRIVACY_POLICY_ROUTE"
              target="_blank"
              class="text-primary"
            >
              политикой конфиденциальности
            </ULink>
          </template>
        </UCheckbox>
      </UFormField>

      <div class="flex flex-col gap-2 md:flex-row">
        <UButton
          :loading="inProgress"
          :disabled="submitDisabled"
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
