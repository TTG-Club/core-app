<script setup lang="ts">
  import { ConfirmDialog } from '~initiative/ui-kit';
  import { UiResult } from '~ui/result';

  import { useFindGameProfile } from '../composables';
  import {
    CATALOG_RETRY_LABEL,
    getFindGameErrorMessage,
    PROFILE_ABOUT_HINT,
    PROFILE_ABOUT_MAX_LENGTH,
    PROFILE_BIRTH_YEAR_LABEL,
    PROFILE_BIRTH_YEAR_MAX,
    PROFILE_BIRTH_YEAR_MIN,
    PROFILE_COMMON_SECTION,
    PROFILE_DIRTY_HINT,
    PROFILE_ERROR_TITLE,
    PROFILE_EXPERIENCE_LABEL,
    PROFILE_EXPERIENCE_MAX,
    PROFILE_EXPERIENCE_MIN,
    PROFILE_GENDER_LABEL,
    PROFILE_GENDER_LABELS,
    PROFILE_GENDERS,
    PROFILE_LEAVE_LABEL,
    PROFILE_MASTER_ABOUT_LABEL,
    PROFILE_MASTER_ABOUT_PLACEHOLDER,
    PROFILE_MASTER_SECTION,
    PROFILE_PLAYER_ABOUT_LABEL,
    PROFILE_PLAYER_ABOUT_PLACEHOLDER,
    PROFILE_PLAYER_SECTION,
    PROFILE_RESET_LABEL,
    PROFILE_TITLE,
    PROFILE_UNSAVED_TITLE,
    SAVE_LABEL,
  } from '../model';

  const {
    confirmLeave,
    error,
    form,
    isDirty,
    isLeaveConfirmOpen,
    isLoading,
    isSaving,
    leaveConfirmMessage,
    refresh,
    resetForm,
    save,
    status,
  } = useFindGameProfile();

  const genderItems = PROFILE_GENDERS.map((value) => ({
    value,
    label: PROFILE_GENDER_LABELS[value],
  }));

  const isError = computed(() => status.value === 'error');

  /**
   * Сохраняет профиль. Результат обрабатывает сам composable (уведомление и
   * текст ошибки), поэтому наружу он здесь не идёт.
   */
  async function handleSave(): Promise<void> {
    await save();
  }
</script>

<template>
  <UCard :ui="{ body: 'flex flex-col gap-6 p-4 sm:p-6' }">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-semibold text-highlighted">
        {{ PROFILE_TITLE }}
      </h2>

      <UBadge
        v-if="isDirty"
        color="warning"
        variant="subtle"
        size="sm"
        icon="tabler:pencil"
        :label="PROFILE_DIRTY_HINT"
      />
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col gap-3"
    >
      <USkeleton class="h-10 w-full" />

      <USkeleton class="h-10 w-full" />

      <USkeleton class="h-28 w-full" />
    </div>

    <UiResult
      v-else-if="isError"
      status="error"
      :title="PROFILE_ERROR_TITLE"
      :sub-title="getFindGameErrorMessage(error)"
    >
      <template #extra>
        <UButton
          :label="CATALOG_RETRY_LABEL"
          @click.left.exact.prevent="refresh()"
        />
      </template>
    </UiResult>

    <template v-else>
      <section class="flex flex-col gap-4">
        <h3 class="font-medium text-highlighted">
          {{ PROFILE_COMMON_SECTION }}
        </h3>

        <div class="grid gap-4 sm:grid-cols-3">
          <UFormField :label="PROFILE_BIRTH_YEAR_LABEL">
            <UInputNumber
              v-model="form.birthYear"
              :min="PROFILE_BIRTH_YEAR_MIN"
              :max="PROFILE_BIRTH_YEAR_MAX"
              :format-options="{ useGrouping: false }"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="PROFILE_GENDER_LABEL">
            <USelect
              v-model="form.gender"
              :items="genderItems"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="PROFILE_EXPERIENCE_LABEL">
            <UInputNumber
              v-model="form.tabletopExperienceYears"
              :min="PROFILE_EXPERIENCE_MIN"
              :max="PROFILE_EXPERIENCE_MAX"
              class="w-full"
            />
          </UFormField>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h3 class="font-medium text-highlighted">
          {{ PROFILE_MASTER_SECTION }}
        </h3>

        <UFormField
          :label="PROFILE_MASTER_ABOUT_LABEL"
          :hint="PROFILE_ABOUT_HINT"
        >
          <UTextarea
            v-model="form.masterAbout"
            :rows="4"
            :maxlength="PROFILE_ABOUT_MAX_LENGTH"
            :placeholder="PROFILE_MASTER_ABOUT_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>
      </section>

      <section class="flex flex-col gap-4">
        <h3 class="font-medium text-highlighted">
          {{ PROFILE_PLAYER_SECTION }}
        </h3>

        <UFormField :label="PROFILE_PLAYER_ABOUT_LABEL">
          <UTextarea
            v-model="form.playerAbout"
            :rows="4"
            :maxlength="PROFILE_ABOUT_MAX_LENGTH"
            :placeholder="PROFILE_PLAYER_ABOUT_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>
      </section>

      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="tabler:rotate"
          :disabled="!isDirty || isSaving"
          :label="PROFILE_RESET_LABEL"
          @click.left.exact.prevent="resetForm"
        />

        <UButton
          icon="tabler:device-floppy"
          :loading="isSaving"
          :disabled="!isDirty"
          :label="SAVE_LABEL"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>

    <ConfirmDialog
      v-model:open="isLeaveConfirmOpen"
      :title="PROFILE_UNSAVED_TITLE"
      :description="leaveConfirmMessage"
      :confirm-label="PROFILE_LEAVE_LABEL"
      confirm-color="warning"
      confirm-icon="tabler:logout"
      @confirm="confirmLeave"
    />
  </UCard>
</template>
