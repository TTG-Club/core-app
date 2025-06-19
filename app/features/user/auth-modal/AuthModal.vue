<script setup lang="ts">
  import { SignIn, SignUp } from './ui';

  import { UButton } from '#components';
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
        h('div', { class: 'flex justify-between items-center gap-12' }, [
          'Теперь вы можете авторизоваться',
          h(
            UButton,
            {
              variant: 'ghost',
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
        ]),
    });
  };

  onMounted(() => showEmailVerifiedNotify());

  watch(opened, () => {
    formType.value = FormType.SIGN_IN;
  });
</script>

<template>
  <UModal
    v-model:open="opened"
    :ui="{
      content: 'overflow-hidden max-w-163 w-full rounded-none md:rounded-lg',
    }"
    aria-describedby="undefined"
  >
    <template #content>
      <div class="flex items-center">
        <img
          class="hidden w-55 shrink-0 object-cover md:block"
          alt="auth-background-image"
          src="/img/bg-login.png"
        />

        <div class="w-full px-6 py-12">
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
      </div>

      <UButton
        class="absolute top-3 right-3"
        icon="i-ttg-close"
        variant="ghost"
        @click.left.exact.prevent="close"
      />
    </template>
  </UModal>
</template>
