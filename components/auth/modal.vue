<script setup lang="ts">
  const enum FormType {
    SIGN_IN,
    SIGN_UP,
    CHANGE_PASSWORD,
  }

  const opened = defineModel<boolean>({ default: false });

  const formType = ref<FormType>(FormType.SIGN_IN);

  const isSignIn = computed(() => formType.value === FormType.SIGN_IN);
  const isSignUp = computed(() => formType.value === FormType.SIGN_UP);
  const _isChangePassword = computed(
    () => formType.value === FormType.CHANGE_PASSWORD,
  );
</script>

<template>
  <AModal
    v-model:open="opened"
    :footer="false"
    centered
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

      <div :class="$style.body">
        <AuthSignIn
          v-if="isSignIn"
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
    max-width: 652px;
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
