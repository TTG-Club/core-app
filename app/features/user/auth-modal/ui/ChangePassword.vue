<script setup lang="ts">
  defineEmits<{
    (e: 'switch:sign-in'): void;
  }>();

  const success = ref(false);
  const inProgress = ref(false);
  const showPwd = ref(false);

  const state = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const rules = {
    usernameOrEmail: (value: string) => {
      if (!value) {
        return 'Поле обязательно для заполнения';
      }

      if (value.includes(' ')) {
        return 'Поле не должно содержать пробелы';
      }

      return true;
    },
    password: (value: string) => {
      if (!value) {
        return 'Поле обязательно для заполнения';
      }

      if (value.includes(' ')) {
        return 'Поле не должно содержать пробелы';
      }

      return true;
    },
  };

  function onSubmit() {}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h4 class="text-2xl">Изменение пароля</h4>

    <UForm
      class="flex flex-col gap-4"
      :state
      @submit.prevent.stop="onSubmit"
      @keyup.enter.exact.prevent.stop="onSubmit"
    >
      <UFormField
        name="usernameOrEmail"
        :validate="rules.usernameOrEmail"
      >
        <UInput
          v-model="state.usernameOrEmail"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          placeholder="Логин или электронная почта"
          autofocus
        />
      </UFormField>

      <UFormField
        name="password"
        :validate="rules.password"
      >
        <UInput
          v-model="state.password"
          autocapitalize="off"
          autocomplete="current-password"
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
              @click.left.exact.prevent="showPwd = !showPwd"
            />
          </template>
        </UInput>
      </UFormField>

      <div class="flex flex-col gap-2 md:flex-row">
        <UButton
          :disabled="success"
          :loading="inProgress"
          class="md:w-auto"
          block
          @click.left.exact.prevent="onSubmit"
        >
          Изменить пароль
        </UButton>

        <UButton
          class="md:w-auto"
          variant="soft"
          block
          @click.left.exact.prevent="$emit('switch:sign-in')"
        >
          Авторизация
        </UButton>
      </div>
    </UForm>
  </div>
</template>
