<script setup lang="ts">
  import type { BastionEditor, PlayerBastion } from '../../model';

  import { ParticipantName } from '~find-game/ui';

  import {
    approveBastionEditor,
    BASTION_SHARE_LABELS,
    fetchBastionEditors,
    getBastionErrorMessage,
    getSharedBastionRoute,
    removeBastionEditor,
    revokeBastionShare,
    shareBastion,
  } from '../../model';

  /**
   * «Поделиться» для владельца, как у листов персонажа: ссылка открывает
   * бастион только на чтение, право на правку открывший просит, а владелец
   * разрешает, отклоняет или отзывает его здесь же.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion } = defineProps<{
    bastion: PlayerBastion;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const toast = useToast();
  const { copy } = useCopyAndShare();
  const requestUrl = useRequestURL();

  const editors = ref<Array<BastionEditor>>([]);
  const isBusy = ref(false);
  const isEditorsLoading = ref(false);

  const shareUrl = computed(() =>
    bastion.shareToken
      ? `${requestUrl.origin}${getSharedBastionRoute(bastion.shareToken)}`
      : '',
  );

  const pendingEditors = computed(() =>
    editors.value.filter((editor) => editor.status === 'PENDING'),
  );

  const approvedEditors = computed(() =>
    editors.value.filter((editor) => editor.status === 'APPROVED'),
  );

  /**
   * Выполняет запрос владельца; на ошибку показывает уведомление.
   *
   * @param action Запрос к core-api.
   */
  async function run(action: () => Promise<void>): Promise<void> {
    isBusy.value = true;

    try {
      await action();
    } catch (error) {
      toast.add({
        title: BASTION_SHARE_LABELS.error,
        description: getBastionErrorMessage(error, BASTION_SHARE_LABELS.error),
        color: 'error',
      });
    } finally {
      isBusy.value = false;
    }
  }

  /**
   * Запоминает запросы и сообщает родителю, сколько их ждёт ответа: счётчик
   * у кнопки «Поделиться» не должен отставать.
   *
   * @param next Запросы после ответа сервера.
   */
  function setEditors(next: Array<BastionEditor>): void {
    editors.value = next;

    const pending = next.filter((editor) => editor.status === 'PENDING').length;

    if (pending !== (bastion.editRequests ?? 0)) {
      emit('updated', { ...bastion, editRequests: pending });
    }
  }

  /** Перечитывает запросы на правку, пока ссылка включена. */
  async function loadEditors(): Promise<void> {
    if (!bastion.shareToken) {
      editors.value = [];

      return;
    }

    isEditorsLoading.value = true;

    try {
      await run(async () => {
        setEditors(await fetchBastionEditors(bastion.id));
      });
    } finally {
      isEditorsLoading.value = false;
    }
  }

  // Запросы могли прийти, пока окно было закрыто.
  watch(isOpen, (opened) => {
    if (opened) {
      void loadEditors();
    }
  });

  /** Включает ссылку. */
  function enable(): Promise<void> {
    return run(async () => {
      emit('updated', await shareBastion(bastion.id));
    });
  }

  /** Отключает ссылку и снимает все права на правку. */
  function disable(): Promise<void> {
    return run(async () => {
      emit('updated', await revokeBastionShare(bastion.id));
      editors.value = [];
    });
  }

  /** Копирует ссылку; об ошибке уже сказало уведомление. */
  async function copyLink(): Promise<void> {
    try {
      await copy(shareUrl);
    } catch {
      // Уведомление показал useCopyAndShare.
    }
  }

  /**
   * Разрешает править бастион.
   *
   * @param editor Запрос.
   */
  function approve(editor: BastionEditor): Promise<void> {
    return run(async () => {
      setEditors(await approveBastionEditor(bastion.id, editor.id));
    });
  }

  /**
   * Отклоняет запрос или отзывает право.
   *
   * @param editor Запрос или право.
   */
  function remove(editor: BastionEditor): Promise<void> {
    return run(async () => {
      setEditors(await removeBastionEditor(bastion.id, editor.id));
    });
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="BASTION_SHARE_LABELS.title"
    :description="BASTION_SHARE_LABELS.hint"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div
          v-if="bastion.shareToken"
          class="flex flex-col gap-2"
        >
          <div class="flex gap-2">
            <UInput
              id="bastion-share-url"
              :model-value="shareUrl"
              readonly
              class="min-w-0 flex-1"
              :aria-label="BASTION_SHARE_LABELS.share"
            />

            <UTooltip :text="BASTION_SHARE_LABELS.copy">
              <UButton
                icon="tabler:copy"
                :aria-label="BASTION_SHARE_LABELS.copy"
                @click.left.exact.prevent="copyLink"
              />
            </UTooltip>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs text-muted">
              {{ BASTION_SHARE_LABELS.disableHint }}
            </span>

            <UButton
              icon="tabler:link-off"
              color="error"
              variant="ghost"
              size="sm"
              :loading="isBusy"
              @click.left.exact.prevent="disable"
            >
              {{ BASTION_SHARE_LABELS.disable }}
            </UButton>
          </div>
        </div>

        <UButton
          v-else
          icon="tabler:link"
          class="self-start"
          :loading="isBusy"
          @click.left.exact.prevent="enable"
        >
          {{ BASTION_SHARE_LABELS.enable }}
        </UButton>

        <section
          v-if="bastion.shareToken"
          class="flex flex-col gap-2"
        >
          <h3 class="text-sm font-semibold text-highlighted">
            {{ BASTION_SHARE_LABELS.editors }}
          </h3>

          <USkeleton
            v-if="isEditorsLoading && !editors.length"
            class="h-10"
          />

          <p
            v-else-if="!editors.length"
            class="text-sm text-muted"
          >
            {{ BASTION_SHARE_LABELS.noEditors }}
          </p>

          <div
            v-for="editor in pendingEditors"
            :key="editor.id"
            class="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/40 px-3 py-2"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-highlighted">
              <ParticipantName :user-id="editor.userId" />
            </span>

            <UBadge
              color="warning"
              variant="subtle"
              size="sm"
            >
              {{ BASTION_SHARE_LABELS.pending }}
            </UBadge>

            <UButton
              icon="tabler:check"
              size="xs"
              :disabled="isBusy"
              @click.left.exact.prevent="approve(editor)"
            >
              {{ BASTION_SHARE_LABELS.approve }}
            </UButton>

            <UButton
              icon="tabler:x"
              size="xs"
              color="neutral"
              variant="ghost"
              :disabled="isBusy"
              @click.left.exact.prevent="remove(editor)"
            >
              {{ BASTION_SHARE_LABELS.decline }}
            </UButton>
          </div>

          <div
            v-for="editor in approvedEditors"
            :key="editor.id"
            class="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/40 px-3 py-2"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-highlighted">
              <ParticipantName :user-id="editor.userId" />
            </span>

            <UBadge
              color="success"
              variant="subtle"
              size="sm"
            >
              {{ BASTION_SHARE_LABELS.approved }}
            </UBadge>

            <UButton
              icon="tabler:user-minus"
              size="xs"
              color="error"
              variant="ghost"
              :disabled="isBusy"
              @click.left.exact.prevent="remove(editor)"
            >
              {{ BASTION_SHARE_LABELS.revoke }}
            </UButton>
          </div>
        </section>
      </div>
    </template>
  </UModal>
</template>
