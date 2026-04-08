<script setup lang="ts">
import type { NotificationAdminResponse, PersonaResponse } from "../model";

import { FetchError } from "ofetch";

import DatePicker from "~/shared/ui/date-picker/DatePicker.vue";
import SelectNotificationType from "~ui/select/SelectNotificationType.vue";

const { persona, notification, isEditing } = defineProps<{
  persona: PersonaResponse | null;
  notification: NotificationAdminResponse | null;
  isEditing: boolean;
}>();

const isOpen = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{
  saved: [personaId: string];
}>();

const toast = useToast();

const notificationText = ref("");
const notificationType = ref("");
const notificationViewLimit = ref<number | null>(null);
const notificationAfterDate = ref<string | undefined>(undefined);
const notificationAfterTime = ref("00:01");
const notificationBeforeDate = ref<string | undefined>(undefined);
const notificationBeforeTime = ref("00:01");
const notificationDisabled = ref(false);
const isSaving = ref(false);

const drawerTitle = computed(() =>
  isEditing ? "Редактирование нотификации" : "Новая нотификация",
);

const canSave = computed(
  () =>
    notificationText.value.trim().length > 0 &&
    notificationType.value.trim().length > 0,
);

function resetForm() {
  notificationText.value = "";
  notificationViewLimit.value = null;
  notificationAfterDate.value = undefined;
  notificationAfterTime.value = "00:01";
  notificationBeforeDate.value = undefined;
  notificationBeforeTime.value = "00:01";
  notificationDisabled.value = false;
}

function splitDateTime(dateTimeString: string | null | undefined): {
  date: string | undefined;
  time: string;
} {
  if (!dateTimeString) {
    return { date: undefined, time: "00:01" };
  }

  const [datePart, timePart] = dateTimeString.split("T");

  return {
    date: datePart,
    time: timePart ? timePart.slice(0, 5) : "00:01",
  };
}

watch(isOpen, (opened) => {
  if (!opened) {
    return;
  }

  if (notification) {
    notificationText.value = String(notification.text ?? "");
    notificationViewLimit.value = notification.view ?? null;

    const afterParsed = splitDateTime(notification.after);

    notificationAfterDate.value = afterParsed.date;
    notificationAfterTime.value = afterParsed.time;

    const beforeParsed = splitDateTime(notification.before);

    notificationBeforeDate.value = beforeParsed.date;
    notificationBeforeTime.value = beforeParsed.time;

    notificationDisabled.value = notification.disabled ?? false;
  } else {
    resetForm();
  }
});

async function saveNotification() {
  if (!persona) {
    return;
  }

  const trimmedText = notificationText.value.trim();

  if (!trimmedText) {
    return;
  }

  isSaving.value = true;

  try {
    const payload = {
      ...(notification || {}),
      personaId: persona.id,
      type: notificationType.value,
      text: trimmedText,
      view: notificationViewLimit.value || null,
      after: notificationAfterDate.value
        ? `${notificationAfterDate.value}T${notificationAfterTime.value || "00:00"}:00`
        : null,
      before: notificationBeforeDate.value
        ? `${notificationBeforeDate.value}T${notificationBeforeTime.value || "00:00"}:00`
        : null,
      disabled: notificationDisabled.value,
    };

    await $fetch("/api/v2/notification", {
      method: isEditing ? "PUT" : "POST",
      body: payload,
    });

    toast.add({
      title: isEditing ? "Нотификация обновлена" : "Нотификация добавлена",
      color: "success",
    });

    isOpen.value = false;
    emit("saved", persona.id);
  } catch (error) {
    const message =
      error instanceof FetchError
        ? error.data?.message || error.message
        : "Неизвестная ошибка";

    toast.add({
      title: "Ошибка при сохранении нотификации",
      description: message,
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="drawerTitle"
    description="Настройте параметры нотификации"
  >
    <template #body>
      <div class="flex h-full flex-col space-y-6">
        <div class="text-sm text-neutral-500">
          Персонаж:
          <span class="font-medium text-highlighted">{{ persona?.name }}</span>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto">
          <SelectNotificationType v-model="notificationType" />

          <div class="flex items-center gap-3">
            <USwitch elv-mod="notificationDisabled" />

            <span class="text-sm font-medium">Отключить показ</span>
          </div>

          <UFormField label="Лимит показов">
            <UInput
              v-model="notificationViewLimit"
              type="number"
              placeholder="100"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Показывать с">
              <DatePicker v-model="notificationAfterDate" class="w-full" />
            </UFormField>

            <UFormField label="Время начала">
              <UInput
                v-model="notificationAfterTime"
                type="time"
                class="w-full"
                :disabled="!notificationAfterDate"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Показывать до">
              <DatePicker v-model="notificationBeforeDate" class="w-full" />
            </UFormField>

            <UFormField label="Время завершения">
              <UInput
                v-model="notificationBeforeTime"
                type="time"
                class="w-full"
                :disabled="!notificationBeforeDate"
              />
            </UFormField>
          </div>

          <UFormField label="Текст (поддерживает разметку)">
            <UTextarea v-model="notificationText" :rows="12" class="w-full" />
          </UFormField>
        </div>

        <div class="flex shrink-0 justify-end gap-2 pt-4">
          <UButton variant="ghost" @click.left.exact.prevent="isOpen = false">
            Отмена
          </UButton>

          <UButton
            :disabled="!canSave"
            :loading="isSaving"
            @click.left.exact.prevent="saveNotification"
          >
            Сохранить
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>
