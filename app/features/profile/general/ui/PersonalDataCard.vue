<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { useGeneral } from '../composables';
  import { ProfileCardUI } from '../model';

  const props = defineProps<{
    profile?: UserProfile;
  }>();

  const { isLoading, updateDisplayName } = useGeneral();

  /**
   * Локальное состояние для отображаемого имени
   */
  const displayName = ref('');

  /**
   * Инициализация displayName из профиля
   */
  watch(
    () => props.profile?.username,
    (username) => {
      if (username) {
        displayName.value = username;
      }
    },
    { immediate: true },
  );

  /**
   * Обработчик изменения отображаемого имени
   */
  async function handleDisplayNameChange() {
    if (!displayName.value.trim()) {
      return;
    }

    await updateDisplayName(displayName.value);
  }
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:user-edit"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Личные данные</h3>
      </div>
    </template>

    <div
      v-if="isDev"
      class="max-w-xl space-y-6"
    >
      <!-- Отображаемое имя -->
      <UFormField
        label="Отображаемое имя"
        description="Это имя будет видно другим пользователям"
      >
        <USkeleton
          v-if="!profile"
          class="h-10 w-full"
        />

        <UInput
          v-else
          v-model="displayName"
          placeholder="Введите имя"
          icon="tabler:forms"
          size="lg"
          :disabled="isLoading"
          @blur="handleDisplayNameChange"
        />
      </UFormField>

      <!-- Логин -->
      <UFormField
        label="Логин"
        description="Уникальный идентификатор пользователя"
      >
        <USkeleton
          v-if="!profile"
          class="h-10 w-full"
        />

        <UInput
          v-else
          :model-value="profile.username"
          disabled
          icon="tabler:fingerprint"
          size="lg"
          variant="outline"
          color="neutral"
        />
      </UFormField>

      <!-- Email -->
      <UFormField
        label="Email"
        description="Адрес электронной почты"
      >
        <USkeleton
          v-if="!profile"
          class="h-10 w-full"
        />

        <UInput
          v-else
          :model-value="profile.email"
          disabled
          icon="tabler:mail"
          size="lg"
        />
      </UFormField>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <UAlert
        icon="tabler:info-circle"
        color="neutral"
        variant="subtle"
        title="Личные данные"
        description="Функция будет доступна в будущих обновлениях"
      />
    </div>
  </UCard>
</template>
