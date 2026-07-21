<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types';
  import type { UserProfile } from '~/shared/types';

  import { useDisplayName } from '../composables';
  import {
    DISPLAY_NAME_DESCRIPTION,
    DISPLAY_NAME_LABEL,
    DISPLAY_NAME_PLACEHOLDER,
    DISPLAY_NAME_SUBMIT_LABEL,
    displayNameSchema,
    EMAIL_DESCRIPTION,
    EMAIL_LABEL,
    LOGIN_DESCRIPTION,
    LOGIN_LABEL,
    PERSONAL_DATA_CARD_TITLE,
    ProfileCardUI,
  } from '../model';

  interface DisplayNameForm {
    displayName: string;
  }

  const props = defineProps<{
    profile?: UserProfile;
  }>();

  const { changeDisplayName, isLoading } = useDisplayName();

  const displayNameForm = reactive<DisplayNameForm>({ displayName: '' });

  // Текущее сохранённое имя: отображаемое, иначе логин (фолбэк «пусто → логин»).
  const savedDisplayName = computed(
    () => props.profile?.displayName || props.profile?.username || '',
  );

  // Синхронизируем поле с профилем при загрузке и после успешной смены:
  // refreshUser обновляет profile → поле сбрасывается на сохранённое значение.
  watch(
    savedDisplayName,
    (value) => {
      displayNameForm.displayName = value;
    },
    { immediate: true },
  );

  const isUnchanged = computed(
    () => displayNameForm.displayName.trim() === savedDisplayName.value,
  );

  const isSubmitDisabled = computed(
    () => isLoading.value || isUnchanged.value || !props.profile,
  );

  async function handleSubmit(event: FormSubmitEvent<DisplayNameForm>) {
    await changeDisplayName(event.data.displayName.trim());
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

        <h3 class="font-semibold text-primary">
          {{ PERSONAL_DATA_CARD_TITLE }}
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Отображаемое имя — единственное редактируемое поле -->
      <UForm
        :state="displayNameForm"
        :schema="displayNameSchema"
        @submit="handleSubmit"
      >
        <UFormField
          :label="DISPLAY_NAME_LABEL"
          :description="DISPLAY_NAME_DESCRIPTION"
          name="displayName"
        >
          <USkeleton
            v-if="!profile"
            class="h-9 w-full"
          />

          <div
            v-else
            class="flex items-start gap-2"
          >
            <UInput
              v-model="displayNameForm.displayName"
              :placeholder="DISPLAY_NAME_PLACEHOLDER"
              :disabled="isLoading"
              :maxlength="24"
              icon="tabler:forms"
              class="flex-1"
            />

            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
              :disabled="isSubmitDisabled"
            >
              {{ DISPLAY_NAME_SUBMIT_LABEL }}
            </UButton>
          </div>
        </UFormField>
      </UForm>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Логин -->
        <UFormField
          :label="LOGIN_LABEL"
          :description="LOGIN_DESCRIPTION"
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
          :label="EMAIL_LABEL"
          :description="EMAIL_DESCRIPTION"
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
    </div>
  </UCard>
</template>
