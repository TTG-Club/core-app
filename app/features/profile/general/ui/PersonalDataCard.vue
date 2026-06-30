<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { ProfileCardUI } from '../model';

  defineProps<{
    profile?: UserProfile;
  }>();
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

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Отображаемое имя (смена пока не реализована на бэкенде) -->
      <UFormField
        v-if="isDev"
        label="Отображаемое имя"
        description="Сменить имя пока нельзя, добавим позже"
        class="sm:col-span-2"
      >
        <USkeleton
          v-if="!profile"
          class="h-9 w-full"
        />

        <UInput
          v-else
          :model-value="profile.username"
          disabled
          icon="tabler:forms"
          class="w-full"
        />
      </UFormField>

      <!-- Логин -->
      <UFormField
        label="Логин"
        description="Уникальный идентификатор"
      >
        <USkeleton
          v-if="!profile"
          class="h-9 w-full"
        />

        <UInput
          v-else
          :model-value="profile.username"
          disabled
          icon="tabler:fingerprint"
          variant="outline"
          color="neutral"
          class="w-full"
        />
      </UFormField>

      <!-- Email -->
      <UFormField
        label="Email"
        description="Адрес электронной почты"
      >
        <USkeleton
          v-if="!profile"
          class="h-9 w-full"
        />

        <UInput
          v-else
          :model-value="profile.email"
          disabled
          icon="tabler:mail"
          class="w-full"
        />
      </UFormField>
    </div>
  </UCard>
</template>
