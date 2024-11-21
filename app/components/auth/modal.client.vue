<script setup lang="ts">
  import { AButton, AFlex, SvgIcon } from '#components';

  const enum FormType {
    SIGN_IN = 'signIn',
    SIGN_UP = 'signUp',
    CHANGE_PASSWORD = 'changePassword',
  }

  const emailVerified = useCookie('email-verified');

  const { notification } = App.useApp();

  const opened = defineModel<boolean>({ default: false });

  const formType = ref<FormType>(FormType.SIGN_IN);

  const isSignIn = computed(() => formType.value === FormType.SIGN_IN);
  const isSignUp = computed(() => formType.value === FormType.SIGN_UP);
  // const isChangePassword = computed(
  //   () => formType.value === FormType.CHANGE_PASSWORD,
  // );

  const close = () => {
    opened.value = false;
    formType.value = FormType.SIGN_IN;
  };

  const showEmailVerifiedNotify = () => {
    if (!emailVerified.value) {
      return;
    }

    emailVerified.value = null;

    notification.success({
      key: 'notify-email-verified',
      message: 'E-Mail подтвержден!',
      description: h(
        AFlex,
        {
          justify: 'space-between',
          align: 'center',
          gap: 12,
        },
        [
          'Теперь вы можете авторизоваться',
          h(
            AButton,
            {
              type: 'text',
              onClick: withModifiers(() => {
                opened.value = true;
                notification.destroy('notify-email-verified');
              }, ['left', 'exact', 'prevent']),
            },
            {
              icon: () =>
                h(SvgIcon, {
                  icon: 'profile/base/move',
                }),
            },
          ),
        ],
      ),
    });
  };

  onMounted(() => showEmailVerifiedNotify());

  watch(opened, () => {
    formType.value = FormType.SIGN_IN;
  });
</script>

<template>
  <AModal
    v-model:open="opened"
    :footer="false"
    centered
    destroy-on-close
    :class="$style.modal"
  >
    <AFlex
      :gap="24"
      align="center"
    >
      <img
        :class="$style.background"
        alt="auth-background-image"
        src="/img/bg-login.png"
      />

      <div
        v-if="opened"
        :class="$style.body"
      >
        <AuthSignIn
          v-if="isSignIn"
          @close="close"
          @switch:sign-up="formType = FormType.SIGN_UP"
          @switch:change-password="formType = FormType.CHANGE_PASSWORD"
        />

        <AuthSignUp
          v-else-if="isSignUp"
          @switch:sign-in="formType = FormType.SIGN_IN"
        />
      </div>
    </AFlex>
  </AModal>
</template>

<style module lang="scss">
  .modal {
    max-width: 652px !important;
  }

  .background {
    display: none;
    flex-shrink: 0;

    width: 220px;

    object-fit: cover;
    border-radius: 8px;

    @include media-min($md) {
      display: block;
    }
  }

  .body {
    width: 100%;
  }
</style>
