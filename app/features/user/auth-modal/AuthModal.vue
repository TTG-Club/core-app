<script setup lang="ts">
  import { UButton } from '#components';

  import { SignIn, SignUp } from './ui';

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

  function close() {
    opened.value = false;
    formType.value = FormType.SIGN_IN;
  }

  function showEmailVerifiedNotify() {
    if (!emailVerified.value) {
      return;
    }

    emailVerified.value = null;

    const { id: toastId } = $toast.add({
      color: 'success',
      title: 'E-Mail подтвержден!',
      description: 'Теперь вы можете авторизоваться',
      actions: [
        {
          icon: 'i-fluent-person-16-regular',
          label: 'Авторизоваться',
          variant: 'ghost',
          onClick: (e) => {
            e?.stopPropagation();

            opened.value = true;

            $toast.remove(toastId);
          },
        },
      ],
    });
  }

  onMounted(() => showEmailVerifiedNotify());

  watch(opened, () => {
    formType.value = FormType.SIGN_IN;
  });
</script>

<template>
  <UModal
    v-model:open="opened"
    class="w-full max-w-sm overflow-hidden md:max-w-163"
  >
    <template #content>
      <div class="flex items-center">
        <img
          class="hidden w-55 shrink-0 object-cover md:block"
          alt="auth-background-image"
          src="/img/bg-login.png"
        />

        <div class="w-full p-8 md:py-12 md:pr-16 md:pl-6">
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
        icon="i-ttg-x"
        variant="ghost"
        @click.left.exact.prevent="close"
      />
    </template>
  </UModal>
</template>
