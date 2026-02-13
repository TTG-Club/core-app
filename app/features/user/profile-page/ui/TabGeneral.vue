<script setup lang="ts">
  import { useUserProfile } from '../composables/useUserProfile';
  import { ProfileCardUI } from '../model';

  import type { UserProfile } from '~/shared/types';

  interface Props {
    profile?: UserProfile;
  }

  const props = defineProps<Props>();

  const { isLoading, updateDisplayName } = useUserProfile();

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
  <div class="space-y-6">
    <!-- Персональные данные (без аватара, так как он в сайдбаре) -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-person-edit-24-regular"
            class="h-5 w-5 text-primary-500"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Личные данные</h3>
        </div>
      </template>

      <div class="max-w-xl space-y-6">
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
            icon="i-fluent-text-field-24-regular"
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
            icon="i-fluent-fingerprint-24-regular"
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
            icon="i-fluent-mail-24-regular"
            size="lg"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Достижения -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-trophy-24-regular"
            class="h-5 w-5 text-warning"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Достижения</h3>
        </div>
      </template>

      <div
        class="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-default bg-elevated p-8"
      >
        <UEmpty
          icon="i-fluent-trophy-24-regular"
          title="Пока нет достижений"
          description="Активно участвуйте в жизни сообщества, чтобы получить награды"
        >
          <template #icon="{ name }">
            <UIcon
              :name="name"
              class="h-12 w-12 text-muted"
              aria-hidden="true"
            />
          </template>
        </UEmpty>
      </div>
    </UCard>
  </div>
</template>
