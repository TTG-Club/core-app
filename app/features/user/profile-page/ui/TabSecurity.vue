<script setup lang="ts">
  import { useUserProfile } from '../composables/useUserProfile';
  import { passwordChangeSchema, ProfileCardUI } from '../model';

  import type { FormSubmitEvent } from '#ui/types';

  import type { PasswordChangeForm } from '../model';

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

  const { isLoading, changePassword } = useUserProfile();

  /**
   * Обработчик отправки формы смены пароля
   */
  async function handlePasswordChange(
    event: FormSubmitEvent<PasswordChangeForm>,
  ) {
    const success = await changePassword(event.data);

    if (success) {
      // Очищаем форму после успешной смены
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Смена пароля -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-key-24-regular"
            class="h-5 w-5 text-primary-500"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Смена пароля</h3>
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
          label="Текущий пароль"
          name="currentPassword"
          required
        >
          <UInput
            v-model="passwordForm.currentPassword"
            :type="showPasswords.current ? 'text' : 'password'"
            placeholder="Введите текущий пароль"
            :disabled="isLoading"
            autocomplete="current-password"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPasswords.current
                    ? 'i-fluent-eye-off-24-regular'
                    : 'i-fluent-eye-24-regular'
                "
                :aria-label="
                  showPasswords.current ? 'Скрыть пароль' : 'Показать пароль'
                "
                color="neutral"
                variant="ghost"
                size="xs"
                @click.left.exact.prevent="
                  showPasswords.current = !showPasswords.current
                "
              />
            </template>
          </UInput>
        </UFormField>

        <!-- Новый пароль -->
        <UFormField
          label="Новый пароль"
          name="newPassword"
          required
          hint="Минимум 8 символов, включая заглавные и строчные буквы, цифры"
        >
          <UInput
            v-model="passwordForm.newPassword"
            :type="showPasswords.new ? 'text' : 'password'"
            placeholder="Введите новый пароль"
            :disabled="isLoading"
            autocomplete="new-password"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPasswords.new
                    ? 'i-fluent-eye-off-24-regular'
                    : 'i-fluent-eye-24-regular'
                "
                :aria-label="
                  showPasswords.new ? 'Скрыть пароль' : 'Показать пароль'
                "
                color="neutral"
                variant="ghost"
                size="xs"
                @click.left.exact.prevent="
                  showPasswords.new = !showPasswords.new
                "
              />
            </template>
          </UInput>
        </UFormField>

        <!-- Подтверждение пароля -->
        <UFormField
          label="Подтвердите новый пароль"
          name="confirmPassword"
          required
        >
          <UInput
            v-model="passwordForm.confirmPassword"
            :type="showPasswords.confirm ? 'text' : 'password'"
            placeholder="Повторите новый пароль"
            :disabled="isLoading"
            autocomplete="new-password"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPasswords.confirm
                    ? 'i-fluent-eye-off-24-regular'
                    : 'i-fluent-eye-24-regular'
                "
                :aria-label="
                  showPasswords.confirm ? 'Скрыть пароль' : 'Показать пароль'
                "
                color="neutral"
                variant="ghost"
                size="xs"
                @click.left.exact.prevent="
                  showPasswords.confirm = !showPasswords.confirm
                "
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
            Изменить пароль
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Дополнительная безопасность -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-shield-checkmark-24-regular"
            class="h-5 w-5 text-primary-500"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">
            Дополнительная безопасность
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          icon="i-fluent-info-24-regular"
          color="neutral"
          variant="subtle"
          title="Двухфакторная аутентификация"
          description="Функция будет доступна в будущих обновлениях"
        />
      </div>
    </UCard>
  </div>
</template>
