<script setup lang="ts">
  /**
   * Форма смены пароля
   */
  const passwordForm = ref({
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

  /**
   * Обработчик смены пароля
   */
  function handlePasswordChange() {
    // TODO: Реализовать смену пароля через API
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Смена пароля -->
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-key-24-regular"
            class="h-5 w-5 text-primary-500"
          />

          <h3 class="font-semibold text-primary">Смена пароля</h3>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Текущий пароль -->
        <UFormField
          label="Текущий пароль"
          required
        >
          <UInput
            v-model="passwordForm.currentPassword"
            :type="showPasswords.current ? 'text' : 'password'"
            placeholder="Введите текущий пароль"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPasswords.current
                    ? 'i-fluent-eye-off-24-regular'
                    : 'i-fluent-eye-24-regular'
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
          required
        >
          <UInput
            v-model="passwordForm.newPassword"
            :type="showPasswords.new ? 'text' : 'password'"
            placeholder="Введите новый пароль"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPasswords.new
                    ? 'i-fluent-eye-off-24-regular'
                    : 'i-fluent-eye-24-regular'
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
          required
        >
          <UInput
            v-model="passwordForm.confirmPassword"
            :type="showPasswords.confirm ? 'text' : 'password'"
            placeholder="Повторите новый пароль"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPasswords.confirm
                    ? 'i-fluent-eye-off-24-regular'
                    : 'i-fluent-eye-24-regular'
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
            color="primary"
            @click.left.exact.prevent="handlePasswordChange"
          >
            Изменить пароль
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Дополнительная безопасность -->
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-shield-checkmark-24-regular"
            class="h-5 w-5 text-primary-500"
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
