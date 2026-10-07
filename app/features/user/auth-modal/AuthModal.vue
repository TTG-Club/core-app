<script setup lang="ts">
  import { UButton } from '#components';

  import { ChangePassword, SignIn, SignUp } from './ui';

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

  const isChangePassword = computed(
    () => formType.value === FormType.CHANGE_PASSWORD,
  );

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
          icon: 'tabler:user',
          label: 'Авторизоваться',
          variant: 'ghost',
          onClick: (event) => {
            event?.stopPropagation();

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
    class="w-full max-w-sm overflow-hidden md:max-w-176"
  >
    <template #content>
      <div class="grid md:min-h-120 md:grid-cols-[15rem_1fr]">
        <div class="relative hidden md:block">
          <img
            class="absolute inset-0 size-full object-cover"
            alt=""
            src="/img/bg-login.png"
          />

          <div
            class="absolute inset-0 bg-linear-to-r from-transparent from-55% to-default"
          />

          <div
            class="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-default/90 to-transparent"
          />
        </div>

        <div class="flex flex-col justify-center p-8 md:py-10 md:pr-12 md:pl-8">
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

          <ChangePassword
            v-else-if="isChangePassword"
            @switch:sign-in="formType = FormType.SIGN_IN"
          />
        </div>
      </div>

      <UButton
        class="absolute top-3 right-3"
        icon="tabler:x"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close"
      />
    </template>
  </UModal>
</template>
