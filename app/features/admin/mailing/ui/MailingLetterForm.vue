<script setup lang="ts">
  import type { MailingFormState } from '../model';

  import { MAILING_RECIPIENTS_MAX, MAILING_SAMPLE_CODE } from '#shared/consts';
  import { applyMailingPlaceholders } from '#shared/utils';
  import { REWARD_TIER_LABELS } from '~admin/subscriptions/model';

  import {
    getInitialMailingForm,
    MAILING_CODE_PLACEHOLDER,
    MAILING_DRAFT_STORAGE_KEY,
    MAILING_EMAIL_PLACEHOLDER,
    MAILING_TIER_OPTIONS,
    mailingFormSchema,
    parseMailingRecipients,
  } from '../model';

  const props = defineProps<{
    /** Идёт рассылка — форма заблокирована. */
    sending?: boolean;
    /** Идёт отправка тестового письма. */
    testing?: boolean;
    /** Адреса, которым коды уже отправляли раньше (из истории). */
    knownEmails: string[];
  }>();

  const emit = defineEmits<{
    submit: [form: MailingFormState, emails: string[]];
    test: [form: MailingFormState, email: string];
  }>();

  const toast = useToast();

  // Черновик письма переживает перезагрузку: рассылка редко пишется за один заход.
  const state = useLocalStorage<MailingFormState>(
    MAILING_DRAFT_STORAGE_KEY,
    getInitialMailingForm(),
    { mergeDefaults: true },
  );

  const testEmail = ref('');

  const parsedRecipients = computed(() =>
    parseMailingRecipients(state.value.recipients),
  );

  const knownEmailsSet = computed(() => new Set(props.knownEmails));

  const alreadySentEmails = computed(() =>
    parsedRecipients.value.valid.filter((email) =>
      knownEmailsSet.value.has(email),
    ),
  );

  const isOverLimit = computed(
    () => parsedRecipients.value.valid.length > MAILING_RECIPIENTS_MAX,
  );

  const canSubmit = computed(
    () => parsedRecipients.value.valid.length > 0 && !isOverLimit.value,
  );

  // Превью письма показываем на образцовом коде и первом адресе списка —
  // ровно то, что увидит получатель, только без отправки.
  const previewEmail = computed(
    () => parsedRecipients.value.valid[0] ?? MAILING_EMAIL_PLACEHOLDER,
  );

  const letterPreview = computed(() =>
    applyMailingPlaceholders(
      state.value.bodyText,
      MAILING_SAMPLE_CODE,
      previewEmail.value,
    ),
  );

  // Итог перед отправкой: сколько писем уйдёт и с каким тиром.
  const submitSummary = computed(() => {
    const count = parsedRecipients.value.valid.length;

    if (!count) {
      return 'Добавьте адреса — и рассылку можно отправлять';
    }

    const letters = getPlural(count, ['письмо', 'письма', 'писем']);

    return `К отправке: ${count} ${letters} · ${REWARD_TIER_LABELS[state.value.rewardTier]}`;
  });

  const recipientsSummary = computed(() => {
    const { valid, invalid, duplicates } = parsedRecipients.value;
    const parts = [`Адресов: ${valid.length}`];

    if (duplicates) {
      parts.push(`убрано повторов: ${duplicates}`);
    }

    if (invalid.length) {
      parts.push(`с ошибкой: ${invalid.length}`);
    }

    return parts.join(' · ');
  });

  /** Убирает из списка адреса, которым код уже отправляли. */
  function removeAlreadySent(): void {
    const excluded = new Set(alreadySentEmails.value);

    state.value.recipients = parsedRecipients.value.valid
      .filter((email) => !excluded.has(email))
      .join('\n');
  }

  /** Убирает из списка строки, не похожие на адрес. */
  function removeInvalid(): void {
    state.value.recipients = parsedRecipients.value.valid.join('\n');
  }

  /**
   * Возвращает тему и текст письма к образцу. Тир, название рассылки и список
   * адресов остаются: их админ заполнял отдельно.
   */
  function resetLetter(): void {
    const { subject, bodyText } = getInitialMailingForm();

    state.value = { ...state.value, subject, bodyText };
  }

  function onSubmit(): void {
    if (!canSubmit.value) {
      return;
    }

    emit('submit', { ...state.value }, [...parsedRecipients.value.valid]);
  }

  function onTest(): void {
    const email = testEmail.value.trim();

    if (!email) {
      toast.add({
        title: 'Укажите адрес',
        description: 'Некуда отправить тестовое письмо',
        color: 'warning',
      });

      return;
    }

    emit('test', { ...state.value }, email);
  }
</script>

<template>
  <UForm
    :state="state"
    :schema="mailingFormSchema"
    class="space-y-6"
    @submit="onSubmit"
  >
    <!-- Письмо -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:mail"
            class="size-5 text-primary"
          />

          <h2 class="font-semibold text-highlighted">Письмо</h2>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField
          label="Тема письма"
          name="subject"
        >
          <UInput
            v-model="state.subject"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Текст письма"
          name="bodyText"
          :help="`Маркер ${MAILING_CODE_PLACEHOLDER} заменится на код получателя, ${MAILING_EMAIL_PLACEHOLDER} — на его адрес. Пустая строка разделяет абзацы.`"
        >
          <UTextarea
            v-model="state.bodyText"
            :rows="14"
            class="w-full"
          />
        </UFormField>

        <div
          class="space-y-2 rounded-lg border border-default bg-elevated/50 p-3"
        >
          <div class="flex items-center gap-2 text-xs text-muted">
            <UIcon name="tabler:eye" />

            <span>Так письмо прочитает получатель (код — образец)</span>
          </div>

          <p class="text-sm whitespace-pre-wrap text-toned">
            {{ letterPreview }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Получатели -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:users"
            class="size-5 text-primary"
          />

          <h2 class="font-semibold text-highlighted">Кому и что отправляем</h2>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Тир награды"
            name="rewardTier"
            help="Один тир на всю рассылку: каждому адресу выпустится свой код с этим тиром."
          >
            <USelectMenu
              v-model="state.rewardTier"
              :items="MAILING_TIER_OPTIONS"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Название рассылки"
            name="label"
            help="Попадёт в метку кодов вместе с адресом — по ней рассылка видна в разделе промокодов."
          >
            <UInput
              v-model="state.label"
              placeholder="Рассылка"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Почтовые ящики"
          name="recipients"
          :help="`Через запятую или с новой строки. Не больше ${MAILING_RECIPIENTS_MAX} адресов за раз.`"
        >
          <UTextarea
            v-model="state.recipients"
            :rows="6"
            placeholder="first@mail.ru, second@mail.ru"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
          <UIcon name="tabler:at" />

          <span>{{ recipientsSummary }}</span>
        </div>

        <UAlert
          v-if="parsedRecipients.invalid.length"
          color="warning"
          variant="subtle"
          icon="tabler:alert-triangle"
          title="Не похожи на почтовый адрес"
          :description="parsedRecipients.invalid.join(', ')"
        >
          <template #actions>
            <UButton
              color="warning"
              variant="soft"
              size="xs"
              @click.left.exact.prevent="removeInvalid"
            >
              Убрать из списка
            </UButton>
          </template>
        </UAlert>

        <UAlert
          v-if="alreadySentEmails.length"
          color="info"
          variant="subtle"
          icon="tabler:history"
          title="Этим адресам код уже отправляли"
          :description="alreadySentEmails.join(', ')"
        >
          <template #actions>
            <UButton
              color="info"
              variant="soft"
              size="xs"
              @click.left.exact.prevent="removeAlreadySent"
            >
              Убрать из списка
            </UButton>
          </template>
        </UAlert>

        <UAlert
          v-if="isOverLimit"
          color="error"
          variant="subtle"
          icon="tabler:alert-circle"
          title="Слишком много адресов"
          :description="`За одну рассылку можно отправить не больше ${MAILING_RECIPIENTS_MAX} писем.`"
        />
      </div>
    </UCard>

    <!-- Действия -->
    <UCard variant="subtle">
      <div class="space-y-5">
        <!-- Проверка письма: поле и кнопка в одной строке, подпись — над ними,
             чтобы ничто не смещало кнопку относительно поля. -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <UIcon
              name="tabler:send"
              class="size-4 text-primary"
            />

            <h3 class="text-sm font-semibold text-highlighted">
              Проверить письмо
            </h3>

            <span class="text-xs text-muted">
              придёт с кодом-образцом, реальный код не выпускается
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="testEmail"
              type="email"
              icon="tabler:at"
              placeholder="Адрес для проверки"
              class="w-full sm:w-72"
            />

            <UButton
              type="button"
              color="neutral"
              variant="subtle"
              icon="tabler:send"
              :loading="testing"
              :disabled="sending || !testEmail.trim()"
              @click.left.exact.prevent="onTest"
            >
              Тестовое письмо
            </UButton>
          </div>
        </div>

        <USeparator />

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm text-muted">{{ submitSummary }}</p>

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              icon="tabler:restore"
              :disabled="sending"
              @click.left.exact.prevent="resetLetter"
            >
              Вернуть текст по умолчанию
            </UButton>

            <UButton
              type="submit"
              icon="tabler:mail-forward"
              :loading="sending"
              :disabled="!canSubmit || sending"
            >
              Отправить рассылку
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </UForm>
</template>
