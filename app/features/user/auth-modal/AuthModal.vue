<script setup lang="ts">
  import { SignIn, SignUp } from './ui';

  import { AButton, AFlex } from '#components';
  import { SvgIcon } from '~ui/icon';
  import { useToast } from '~ui/toast';

  const enum FormType {
    SIGN_IN = 'signIn',
    SIGN_UP = 'signUp',
    CHANGE_PASSWORD = 'changePassword',
  }

  const emailVerified = useCookie('email-verified');

  const $toast = useToast();

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

    const { close: closeToast } = $toast.success({
      title: 'E-Mail подтвержден!',
      description: () =>
        h(
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
                  closeToast();
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
        <SignIn
          v-if="isSignIn"
          @close="close"
          @switch:sign-up="formType = FormType.SIGN_UP"
          @switch:change-password="formType = FormType.CHANGE_PASSWORD"
        />

        <SignUp
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
    :global {
      .ant-modal-content {
        overflow: hidden;
        padding: 24px;

        @include media-min($md) {
          padding: 0 24px 0 0;
        }
      }
    }
  }

  .background {
    display: none;
    flex-shrink: 0;
    width: 220px;
    object-fit: cover;

    @include media-min($md) {
      display: block;
    }
  }

  .body {
    width: 100%;
  }
</style>
