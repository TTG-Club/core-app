<script setup lang="ts">
  import type {
    NotificationAdminResponse,
    NotificationTypeOption,
    PersonaResponse,
  } from '../model';

  import DatePicker from '~/shared/ui/date-picker/DatePicker.vue';

  import {
    DEFAULT_NOTIFICATION_TIME,
    DEFAULT_NOTIFICATION_TYPE,
    extractNotificationText,
    parseDateTimeField,
  } from '../model';

  const props = defineProps<{
    persona: PersonaResponse | null;
    notification: NotificationAdminResponse | null;
    notificationTypes: NotificationTypeOption[];
  }>();

  const isOpen = defineModel<boolean>('open', { required: true });

  const emit = defineEmits<{
    saved: [personaId: string];
  }>();

  const toast = useToast();

  const notifType = ref(DEFAULT_NOTIFICATION_TYPE);
  const notifText = ref('');
  const notifView = ref<number | null>(null);
  const notifAfterDate = ref<string | undefined>(undefined);
  const notifAfterTime = ref(DEFAULT_NOTIFICATION_TIME);
  const notifBeforeDate = ref<string | undefined>(undefined);
  const notifBeforeTime = ref(DEFAULT_NOTIFICATION_TIME);
  const notifDisabled = ref(false);
  const isSaving = ref(false);

  const isEditing = computed(() => !!props.notification);

  const canSave = computed(() => {
    const text = notifText.value;

    return typeof text === 'string' && text.trim().length > 0;
  });

  function resetForm() {
    notifType.value = DEFAULT_NOTIFICATION_TYPE;
    notifText.value = '';
    notifView.value = null;
    notifAfterDate.value = undefined;
    notifAfterTime.value = DEFAULT_NOTIFICATION_TIME;
    notifBeforeDate.value = undefined;
    notifBeforeTime.value = DEFAULT_NOTIFICATION_TIME;
    notifDisabled.value = false;
  }

  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    if (props.notification) {
      notifType.value = props.notification.type ?? DEFAULT_NOTIFICATION_TYPE;
      notifText.value = extractNotificationText(props.notification.text);
      notifView.value = props.notification.view ?? null;

      const afterParsed = parseDateTimeField(
        props.notification.after,
        DEFAULT_NOTIFICATION_TIME,
      );

      notifAfterDate.value = afterParsed.date;
      notifAfterTime.value = afterParsed.time;

      const beforeParsed = parseDateTimeField(
        props.notification.before,
        DEFAULT_NOTIFICATION_TIME,
      );

      notifBeforeDate.value = beforeParsed.date;
      notifBeforeTime.value = beforeParsed.time;

      notifDisabled.value = props.notification.disabled ?? false;
    } else {
      resetForm();
    }
  });

  async function saveNotification() {
    if (!props.persona) {
      return;
    }

    const trimmedText = (notifText.value || '').trim();

    if (!trimmedText) {
      return;
    }

    isSaving.value = true;

    try {
      const payload = {
        ...(props.notification || {}),
        type: notifType.value,
        personaId: props.persona.id,
        text: trimmedText,
        view: notifView.value || null,
        after: notifAfterDate.value
          ? `${notifAfterDate.value}T${notifAfterTime.value || '00:00'}:00`
          : null,
        before: notifBeforeDate.value
          ? `${notifBeforeDate.value}T${notifBeforeTime.value || '00:00'}:00`
          : null,
        disabled: notifDisabled.value,
      };

      await $fetch('/api/v2/notification', {
        method: isEditing.value ? 'PUT' : 'POST',
        body: payload,
      });

      toast.add({
        title: isEditing.value ? 'Фраза обновлена' : 'Фраза добавлена',
        color: 'success',
      });

      isOpen.value = false;
      emit('saved', props.persona.id);
    } catch (error) {
      consola.error('Failed to save notification:', error);
      toast.add({ title: 'Ошибка при сохранении фразы', color: 'error' });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="isEditing ? 'Редактирование фразы' : 'Новая фраза'"
    description="Настройте параметры нотификации"
  >
    <template #body>
      <div class="flex h-full flex-col space-y-6">
        <div class="text-sm text-neutral-500">
          Выбрана персона:
          <span class="font-medium text-highlighted">{{ persona?.name }}</span>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto">
          <div class="flex items-center gap-3">
            <USwitch v-model="notifDisabled" />

            <span class="text-sm font-medium">Отключить показ</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Тип фразы">
              <USelect
                v-model="notifType"
                :items="notificationTypes || []"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Лимит показов">
              <UInput
                v-model="notifView"
                type="number"
                placeholder="100"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Показывать с">
              <DatePicker
                v-model="notifAfterDate"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Время начала">
              <UInput
                v-model="notifAfterTime"
                type="time"
                class="w-full"
                :disabled="!notifAfterDate"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Показывать до">
              <DatePicker
                v-model="notifBeforeDate"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Время завершения">
              <UInput
                v-model="notifBeforeTime"
                type="time"
                class="w-full"
                :disabled="!notifBeforeDate"
              />
            </UFormField>
          </div>

          <UFormField label="Текст (поддерживает разметку)">
            <UTextarea
              v-model="notifText"
              :rows="12"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex shrink-0 justify-end gap-2 pt-4">
          <UButton
            variant="ghost"
            @click.left.exact.prevent="isOpen = false"
          >
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
