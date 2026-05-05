<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types';

  import type { PasswordChangeForm } from '../model';

  import { useSecurity } from '../composables';
  import {
    PASSWORD_CHANGE_CARD_TITLE,
    PASSWORD_CHANGE_CONFIRM_PASSWORD_LABEL,
    PASSWORD_CHANGE_CONFIRM_PASSWORD_PLACEHOLDER,
    PASSWORD_CHANGE_CURRENT_PASSWORD_LABEL,
    PASSWORD_CHANGE_CURRENT_PASSWORD_PLACEHOLDER,
    PASSWORD_CHANGE_HIDE_PASSWORD_LABEL,
    PASSWORD_CHANGE_NEW_PASSWORD_HINT,
    PASSWORD_CHANGE_NEW_PASSWORD_LABEL,
    PASSWORD_CHANGE_NEW_PASSWORD_PLACEHOLDER,
    PASSWORD_CHANGE_SHOW_PASSWORD_LABEL,
    PASSWORD_CHANGE_SUBMIT_LABEL,
    passwordChangeSchema,
    ProfileCardUI,
  } from '../model';

  /**
   * Форма смены пароля
   */
  const passwordForm = ref<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /**
   * Показывать ли пароли
   */
  const showPasswords = ref({
    current: false,
    new: false,
    confirm: false,
  });

  const { isLoading, changePassword } = useSecurity();

  /**
   * Иконка для кнопки переключения видимости пароля
   */
  function passwordToggleIcon(isVisible: boolean): string {
    return isVisible ? 'tabler:eye-off' : 'tabler:eye';
  }

  /**
   * Подпись для кнопки переключения видимости пароля
   */
  function passwordToggleLabel(isVisible: boolean): string {
    return isVisible
      ? PASSWORD_CHANGE_HIDE_PASSWORD_LABEL
      : PASSWORD_CHANGE_SHOW_PASSWORD_LABEL;
  }

  /**
   * Переключение видимости поля пароля
   */
  function togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    showPasswords.value[field] = !showPasswords.value[field];
  }

  /**
   * Обработчик отправки формы смены пароля
   */
  async function handlePasswordChange(
    event: FormSubmitEvent<PasswordChangeForm>,
  ) {
    const success = await changePassword(event.data);

    if (success) {
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
    }
  }
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:key"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">
          {{ PASSWORD_CHANGE_CARD_TITLE }}
        </h3>
      </div>
    </template>

    <UForm
      :state="passwordForm"
      :schema="passwordChangeSchema"
      class="space-y-4"
      @submit="handlePasswordChange"
    >
      <!-- Текущий пароль -->
      <UFormField
        :label="PASSWORD_CHANGE_CURRENT_PASSWORD_LABEL"
        name="currentPassword"
        required
      >
        <UInput
          v-model="passwordForm.currentPassword"
          :type="showPasswords.current ? 'text' : 'password'"
          :placeholder="PASSWORD_CHANGE_CURRENT_PASSWORD_PLACEHOLDER"
          :disabled="isLoading"
          autocomplete="current-password"
        >
          <template #trailing>
            <UButton
              :icon="passwordToggleIcon(showPasswords.current)"
              :aria-label="passwordToggleLabel(showPasswords.current)"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="togglePasswordVisibility('current')"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Новый пароль -->
      <UFormField
        :label="PASSWORD_CHANGE_NEW_PASSWORD_LABEL"
        name="newPassword"
        required
        :hint="PASSWORD_CHANGE_NEW_PASSWORD_HINT"
      >
        <UInput
          v-model="passwordForm.newPassword"
          :type="showPasswords.new ? 'text' : 'password'"
          :placeholder="PASSWORD_CHANGE_NEW_PASSWORD_PLACEHOLDER"
          :disabled="isLoading"
          autocomplete="new-password"
        >
          <template #trailing>
            <UButton
              :icon="passwordToggleIcon(showPasswords.new)"
              :aria-label="passwordToggleLabel(showPasswords.new)"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="togglePasswordVisibility('new')"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Подтверждение пароля -->
      <UFormField
        :label="PASSWORD_CHANGE_CONFIRM_PASSWORD_LABEL"
        name="confirmPassword"
        required
      >
        <UInput
          v-model="passwordForm.confirmPassword"
          :type="showPasswords.confirm ? 'text' : 'password'"
          :placeholder="PASSWORD_CHANGE_CONFIRM_PASSWORD_PLACEHOLDER"
          :disabled="isLoading"
          autocomplete="new-password"
        >
          <template #trailing>
            <UButton
              :icon="passwordToggleIcon(showPasswords.confirm)"
              :aria-label="passwordToggleLabel(showPasswords.confirm)"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="togglePasswordVisibility('confirm')"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Кнопка сохранения -->
      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          :loading="isLoading"
          :disabled="isLoading"
        >
          {{ PASSWORD_CHANGE_SUBMIT_LABEL }}
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
