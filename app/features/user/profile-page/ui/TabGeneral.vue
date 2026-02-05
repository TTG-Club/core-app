<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  interface Props {
    profile?: UserProfile;
  }

  defineProps<Props>();

  /**
   * Обработчик изменения отображаемого имени
   */
  function handleDisplayNameChange() {
    // TODO: Реализовать сохранение имени через API
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Персональные данные (без аватара, так как он в сайдбаре) -->
    <UCard
      :ui="{
        header: 'px-6 py-4',
        body: 'p-6',
      }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-person-edit-24-regular"
            class="h-5 w-5 text-primary-500"
          />

          <h3 class="font-semibold text-white">Личные данные</h3>
        </div>
      </template>

      <div class="max-w-xl space-y-6">
        <!-- Отображаемое имя -->
        <UFormField
          label="Отображаемое имя"
          description="Это имя будет видно другим пользователям"
        >
          <UInput
            :model-value="profile?.username"
            placeholder="Введите имя"
            icon="i-fluent-text-field-24-regular"
            size="lg"
            @blur="handleDisplayNameChange"
          />
        </UFormField>

        <!-- Логин -->
        <UFormField
          label="Логин"
          description="Уникальный идентификатор пользователя"
        >
          <UInput
            :model-value="profile?.username"
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
          <div class="flex gap-2">
            <UInput
              :model-value="profile?.email"
              class="flex-1"
              disabled
              icon="i-fluent-mail-24-regular"
              size="lg"
            />

            <UButton
              color="neutral"
              variant="soft"
              label="Изменить"
            />
          </div>
        </UFormField>
      </div>
    </UCard>

    <!-- Достижения -->
    <UCard
      :ui="{
        header: 'px-6 py-4',
        body: 'p-6',
      }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-trophy-24-regular"
            class="h-5 w-5 text-yellow-500"
          />

          <h3 class="font-semibold text-white">Достижения</h3>
        </div>
      </template>

      <div
        class="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-8"
      >
        <UEmpty
          icon="i-fluent-trophy-24-regular"
          title="Пока нет достижений"
          description="Активно участвуйте в жизни сообщества, чтобы получить награды"
        >
          <template #icon="{ name }">
            <UIcon
              :name="name"
              class="h-12 w-12 text-gray-700"
            />
          </template>
        </UEmpty>
      </div>
    </UCard>
  </div>
</template>
