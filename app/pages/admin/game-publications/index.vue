<script setup lang="ts">
  import type {
    PublicationChannel,
    PublicationChannelForm,
    PublicationSettingsForm as SettingsForm,
  } from '~admin/game-publications/model';

  import { useGamePublications } from '~admin/game-publications/composables';
  import {
    formatPublicationSchedule,
    PUBLICATION_CHANNEL_BADGES,
    PUBLICATION_DATE_FORMAT,
    PUBLICATION_DEFAULT_TAB,
    PUBLICATION_ICONS,
    PUBLICATION_LEGACY_ROUTE,
    PUBLICATION_PLATFORMS,
    PUBLICATION_STATUS_LABELS,
    PUBLICATION_TABS,
    PUBLICATION_TEXT,
  } from '~admin/game-publications/model';
  import {
    PublicationChannelEditor,
    PublicationSettingsForm,
  } from '~admin/game-publications/ui';

  definePageMeta({ alias: PUBLICATION_LEGACY_ROUTE });

  const {
    overview,
    preview,
    history,
    busy,
    testingChannelId,
    feedbackChannelId,
    accessRevoked,
    notice,
    failure,
    loading,
    settingsLoading,
    hasError,
    saveSettings,
    saveChannel,
    deleteChannel,
    testChannel,
    refresh,
  } = useGamePublications();

  const editing = ref(false);
  const editingSettings = ref(false);
  const selectedChannel = ref<PublicationChannel | null>(null);
  const removingId = ref<string | null>(null);

  const settingsDisabled = computed(
    () =>
      busy.value
      || settingsLoading.value
      || !overview.value?.configured
      || accessRevoked.value,
  );

  const editorKey = computed(() => selectedChannel.value?.id);

  const editorTitle = computed(() =>
    selectedChannel.value
      ? PUBLICATION_TEXT.channelSettings
      : PUBLICATION_TEXT.addChannel,
  );

  const modalDismissible = computed(() => !busy.value);

  const modalClose = computed(() => ({
    'disabled': busy.value,
    'aria-label': PUBLICATION_TEXT.close,
  }));

  const globalSummary = computed(() =>
    overview.value
      ? formatPublicationSchedule(overview.value.settings.schedule)
      : '',
  );

  const globalStatus = computed(() =>
    overview.value?.settings.enabled
      ? PUBLICATION_TEXT.globalActive
      : PUBLICATION_TEXT.globalPaused,
  );

  const serviceUnavailable = computed(
    () => overview.value && !overview.value.configured,
  );

  const telegramUnavailable = computed(
    () => overview.value && !overview.value.telegramConfigured,
  );

  const vkUnavailable = computed(
    () => overview.value && !overview.value.vkConfigured,
  );

  const channelRows = computed(() => {
    const snapshot = overview.value;

    if (!snapshot) {
      return [];
    }

    return snapshot.channels.map((channel) => ({
      ...channel,
      platformLabel: PUBLICATION_PLATFORMS[channel.platform].label,
      testDisabled:
        settingsDisabled.value
        || (channel.platform === PUBLICATION_PLATFORMS.TELEGRAM.value
          && !snapshot.telegramConfigured)
        || (channel.platform === PUBLICATION_PLATFORMS.VK.value
          && !snapshot.vkConfigured),
      badge: channel.enabled
        ? PUBLICATION_CHANNEL_BADGES.active
        : PUBLICATION_CHANNEL_BADGES.paused,
      scheduleLabel:
        channel.schedule === null
          ? PUBLICATION_TEXT.inherited
          : PUBLICATION_TEXT.individual,
      scheduleSummary: formatPublicationSchedule(
        channel.schedule ?? snapshot.settings.schedule,
      ),
      nextLabel: channel.nextRunAt
        ? PUBLICATION_DATE_FORMAT.format(new Date(channel.nextRunAt))
        : PUBLICATION_TEXT.notScheduled,
      confirmingRemoval: removingId.value === channel.id,
      testing: testingChannelId.value === channel.id,
      testNotice: feedbackChannelId.value === channel.id ? notice.value : '',
      testFailure: feedbackChannelId.value === channel.id ? failure.value : '',
    }));
  });

  const historyRows = computed(
    () =>
      history.value?.map((run) => ({
        ...run,
        platformLabel: PUBLICATION_PLATFORMS[run.platform].label,
        statusLabel: PUBLICATION_STATUS_LABELS[run.status],
        dateLabel: PUBLICATION_DATE_FORMAT.format(new Date(run.scheduledAt)),
      })) ?? [],
  );

  const pageNotice = computed(() =>
    feedbackChannelId.value ? '' : notice.value,
  );

  const pageFailure = computed(() =>
    feedbackChannelId.value ? '' : failure.value,
  );

  const refreshDisabled = computed(() => busy.value || accessRevoked.value);

  const previewRows = computed(
    () =>
      preview.value?.map((game, index) => ({
        ...game,
        position: index + 1,
        freeSeats: game.maxPlayers - game.takenSeats,
      })) ?? [],
  );

  /** Открывает пустую форму нового канала. */
  function addChannel(): void {
    failure.value = '';
    selectedChannel.value = null;
    editing.value = true;
    removingId.value = null;
  }

  /** Открывает независимую копию настроек выбранного канала. */
  function editChannel(channel: PublicationChannel): void {
    failure.value = '';
    selectedChannel.value = channel;
    editing.value = true;
    removingId.value = null;
  }

  /** Закрывает редактор без сохранения. */
  function closeEditor(): void {
    editing.value = false;
    selectedChannel.value = null;
  }

  /** Закрывает окно канала, если сохранение не выполняется. */
  function updateEditorOpen(open: boolean): void {
    if (!open && !busy.value) {
      closeEditor();
    }
  }

  /** Открывает отдельную форму общего расписания. */
  function openSettings(): void {
    failure.value = '';
    editingSettings.value = true;
  }

  /** Закрывает общие настройки без сохранения. */
  function closeSettings(): void {
    editingSettings.value = false;
  }

  watch(accessRevoked, (revoked) => {
    if (revoked) {
      closeEditor();
      closeSettings();
      removingId.value = null;
    }
  });

  /** Не позволяет закрыть настройки до завершения сохранения. */
  function updateSettingsOpen(open: boolean): void {
    if (!open && !busy.value) {
      closeSettings();
    }
  }

  /** Закрывает редактор только после подтверждённого сохранения. */
  async function submitChannel(form: PublicationChannelForm): Promise<void> {
    if (await saveChannel(selectedChannel.value?.id ?? null, form)) {
      closeEditor();
    }
  }

  /** Сохраняет общий график. */
  async function submitSettings(settings: SettingsForm): Promise<void> {
    if (await saveSettings(settings)) {
      closeSettings();
    }
  }

  /** Запрашивает локальное подтверждение удаления конкретного канала. */
  function prepareRemoval(channel: PublicationChannel): void {
    removingId.value = channel.id;
  }

  /** Удаляет подтверждённый канал и закрывает его редактор. */
  async function confirmRemoval(channel: PublicationChannel): Promise<void> {
    if (await deleteChannel(channel)) {
      removingId.value = null;
      closeEditor();
    }
  }

  /** Отменяет локальное подтверждение удаления. */
  function cancelRemoval(): void {
    removingId.value = null;
  }

  /** Обновляет серверный снимок и закрывает устаревшую форму. */
  async function reload(): Promise<void> {
    closeEditor();
    closeSettings();
    removingId.value = null;
    await refresh();
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="PUBLICATION_TEXT.title"
  >
    <div class="space-y-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <p class="text-lg text-highlighted">
            {{ PUBLICATION_TEXT.description }}
          </p>

          <p class="text-sm text-muted">{{ PUBLICATION_TEXT.timezone }}</p>
        </div>

        <UButton
          :icon="PUBLICATION_ICONS.refresh"
          color="neutral"
          variant="soft"
          :loading="loading"
          :disabled="refreshDisabled"
          @click.left.exact.prevent="reload"
          >{{ PUBLICATION_TEXT.refresh }}</UButton
        >
      </div>

      <UAlert
        v-if="serviceUnavailable"
        role="status"
        color="warning"
        variant="outline"
        :description="PUBLICATION_TEXT.unavailable"
      />

      <UAlert
        v-if="telegramUnavailable"
        role="status"
        color="warning"
        variant="outline"
        :description="PUBLICATION_TEXT.telegramUnavailable"
      />

      <UAlert
        v-if="vkUnavailable"
        role="status"
        color="warning"
        variant="outline"
        :description="PUBLICATION_TEXT.vkUnavailable"
      />

      <p
        v-if="hasError"
        role="alert"
        class="text-error"
      >
        {{ PUBLICATION_TEXT.loadError }}
      </p>

      <p
        v-if="pageFailure && !editing && !editingSettings"
        role="alert"
        class="break-words text-error"
      >
        {{ pageFailure }}
      </p>

      <p
        v-if="pageNotice"
        role="status"
        class="break-words text-success"
      >
        {{ pageNotice }}
      </p>

      <p
        v-if="!overview && loading"
        role="status"
        class="text-muted"
      >
        {{ PUBLICATION_TEXT.loading }}
      </p>

      <UTabs
        :items="PUBLICATION_TABS"
        :default-value="PUBLICATION_DEFAULT_TAB"
        variant="link"
        :ui="{
          list: 'w-full',
          trigger: 'min-w-0 flex-1 px-2',
          label: 'whitespace-normal text-center',
          content: 'pt-6',
        }"
      >
        <template #channels>
          <div
            v-if="overview"
            class="space-y-6"
          >
            <UCard>
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0 space-y-2">
                  <h2
                    class="flex items-center gap-2 font-semibold text-highlighted"
                  >
                    <UIcon
                      :name="PUBLICATION_ICONS.schedule"
                      class="size-5 shrink-0 text-primary"
                    />
                    {{ PUBLICATION_TEXT.global }}
                  </h2>

                  <p class="text-sm font-medium">{{ globalStatus }}</p>

                  <p class="text-sm text-highlighted">{{ globalSummary }}</p>

                  <p class="text-sm text-muted">
                    {{ PUBLICATION_TEXT.globalHint }}
                  </p>
                </div>

                <UButton
                  :icon="PUBLICATION_ICONS.edit"
                  color="neutral"
                  variant="soft"
                  :disabled="settingsDisabled"
                  @click.left.exact.prevent="openSettings"
                  >{{ PUBLICATION_TEXT.configure }}</UButton
                >
              </div>
            </UCard>

            <UCard :ui="{ body: 'divide-y divide-default p-0 sm:p-0' }">
              <template #header>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <h2 class="font-semibold text-highlighted">
                      {{ PUBLICATION_TEXT.channels }}
                    </h2>

                    <UBadge
                      color="neutral"
                      variant="subtle"
                      >{{ channelRows.length }}</UBadge
                    >
                  </div>

                  <UButton
                    :icon="PUBLICATION_ICONS.add"
                    :disabled="settingsDisabled"
                    @click.left.exact.prevent="addChannel"
                    >{{ PUBLICATION_TEXT.addChannel }}</UButton
                  >
                </div>
              </template>

              <p
                v-if="!channelRows.length"
                class="p-5 text-sm text-muted"
              >
                {{ PUBLICATION_TEXT.noChannels }}
              </p>

              <article
                v-for="channel in channelRows"
                :key="channel.id"
                class="space-y-4 p-4 sm:p-6"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <h3 class="font-medium break-words text-highlighted">
                      {{ channel.name }}
                    </h3>

                    <p class="text-sm text-muted">
                      {{ channel.platformLabel }} · {{ channel.scheduleLabel }}
                    </p>
                  </div>

                  <UBadge
                    v-bind="channel.badge"
                    variant="subtle"
                  />
                </div>

                <div class="space-y-1 text-sm">
                  <p>{{ channel.scheduleSummary }}</p>

                  <p class="text-muted">
                    {{ PUBLICATION_TEXT.next }}: {{ channel.nextLabel }}
                  </p>
                </div>

                <div
                  v-if="channel.confirmingRemoval"
                  class="flex flex-wrap gap-2"
                >
                  <UButton
                    color="error"
                    variant="soft"
                    :loading="busy"
                    @click.left.exact.prevent="confirmRemoval(channel)"
                    >{{ PUBLICATION_TEXT.confirmRemove }}</UButton
                  >

                  <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="busy"
                    @click.left.exact.prevent="cancelRemoval"
                    >{{ PUBLICATION_TEXT.cancel }}</UButton
                  >
                </div>

                <div
                  v-else
                  class="flex flex-wrap gap-2"
                >
                  <UButton
                    :icon="PUBLICATION_ICONS.test"
                    :loading="channel.testing"
                    :disabled="channel.testDisabled"
                    :title="PUBLICATION_TEXT.testHint"
                    variant="soft"
                    @click.left.exact.prevent="testChannel(channel)"
                    >{{ PUBLICATION_TEXT.test }}</UButton
                  >

                  <UButton
                    color="neutral"
                    variant="soft"
                    :disabled="settingsDisabled"
                    @click.left.exact.prevent="editChannel(channel)"
                    >{{ PUBLICATION_TEXT.edit }}</UButton
                  >

                  <UButton
                    color="error"
                    variant="ghost"
                    :disabled="busy"
                    @click.left.exact.prevent="prepareRemoval(channel)"
                    >{{ PUBLICATION_TEXT.remove }}</UButton
                  >
                </div>

                <p
                  v-if="channel.testNotice"
                  role="status"
                  class="text-sm break-words text-success"
                >
                  {{ channel.testNotice }}
                </p>

                <p
                  v-if="channel.testFailure"
                  role="alert"
                  class="text-sm break-words text-error"
                >
                  {{ channel.testFailure }}
                </p>
              </article>
            </UCard>
          </div>
        </template>

        <template #preview>
          <UCard :ui="{ body: 'divide-y divide-default p-0 sm:p-0' }">
            <template #header>
              <div class="flex items-center gap-2">
                <h2 class="font-semibold text-highlighted">
                  {{ PUBLICATION_TEXT.preview }}
                </h2>

                <UBadge
                  v-if="preview"
                  color="neutral"
                  variant="subtle"
                  >{{ preview.length }}</UBadge
                >
              </div>

              <p class="mt-2 text-sm text-muted">
                {{ PUBLICATION_TEXT.selection }}
              </p>

              <p class="mt-2 text-sm text-muted">
                {{ PUBLICATION_TEXT.previewHint }}
              </p>
            </template>

            <p
              v-if="preview && !preview.length"
              class="p-5 text-sm text-muted"
            >
              {{ PUBLICATION_TEXT.noGames }}
            </p>

            <article
              v-for="game in previewRows"
              :key="game.id"
              class="flex gap-3 p-4 sm:gap-5 sm:p-6"
            >
              <UBadge
                color="neutral"
                variant="soft"
                class="mt-0.5 h-fit shrink-0 tabular-nums"
                >{{ game.position }}</UBadge
              >

              <div class="min-w-0 flex-1 space-y-2">
                <h3 class="font-medium break-words text-highlighted">
                  {{ game.title }}
                </h3>

                <p class="text-sm break-words text-muted">
                  {{ game.system }} · {{ PUBLICATION_TEXT.taken }}
                  {{ game.takenSeats }}/{{ game.maxPlayers }} ·
                  {{ PUBLICATION_TEXT.free }} {{ game.freeSeats }}
                </p>

                <p
                  v-if="game.genreSummary"
                  class="text-sm break-words text-muted"
                >
                  {{ PUBLICATION_TEXT.genres }}: {{ game.genreSummary }}
                </p>

                <UButton
                  :to="game.url"
                  target="_blank"
                  variant="link"
                  :trailing-icon="PUBLICATION_ICONS.external"
                  class="p-0"
                  >{{ PUBLICATION_TEXT.more }}</UButton
                >
              </div>
            </article>
          </UCard>
        </template>

        <template #history>
          <UCard :ui="{ body: 'divide-y divide-default p-0 sm:p-0' }">
            <template #header
              ><h2 class="font-semibold text-highlighted">
                {{ PUBLICATION_TEXT.history }}
              </h2></template
            >

            <p
              v-if="history && !history.length"
              class="p-5 text-sm text-muted"
            >
              {{ PUBLICATION_TEXT.noHistory }}
            </p>

            <article
              v-for="run in historyRows"
              :key="run.id"
              class="flex flex-wrap justify-between gap-3 p-4 sm:p-6"
            >
              <div class="min-w-0 space-y-1">
                <p class="font-medium break-words">
                  {{ run.channelName }} · {{ run.platformLabel }} ·
                  {{ run.statusLabel }}
                </p>

                <p class="text-sm break-words text-muted">
                  {{ run.detail }} · {{ PUBLICATION_TEXT.historyCount }}:
                  {{ run.gameCount }}
                </p>
              </div>

              <time
                :datetime="run.scheduledAt"
                class="shrink-0 text-sm text-muted"
                >{{ run.dateLabel }}</time
              >
            </article>

            <template #footer
              ><p class="text-sm text-muted">
                {{ PUBLICATION_TEXT.deliveryHint }}
              </p></template
            >
          </UCard>
        </template>
      </UTabs>
    </div>

    <UModal
      v-if="overview"
      :open="editing"
      :title="editorTitle"
      :description="PUBLICATION_TEXT.timezone"
      :close="modalClose"
      :dismissible="modalDismissible"
      @update:open="updateEditorOpen"
    >
      <template #body>
        <p
          v-if="pageFailure"
          role="alert"
          class="mb-4 break-words text-error"
        >
          {{ pageFailure }}
        </p>

        <PublicationChannelEditor
          v-if="editing"
          :key="editorKey"
          :channel="selectedChannel"
          :busy="settingsDisabled"
          :vk-group-configured="overview?.vkGroupConfigured ?? false"
          @save="submitChannel"
          @cancel="closeEditor"
        />
      </template>
    </UModal>

    <UModal
      v-if="overview"
      :open="editingSettings"
      :title="PUBLICATION_TEXT.global"
      :description="PUBLICATION_TEXT.timezone"
      :close="modalClose"
      :dismissible="modalDismissible"
      @update:open="updateSettingsOpen"
    >
      <template #body>
        <p
          v-if="pageFailure"
          role="alert"
          class="mb-4 break-words text-error"
        >
          {{ pageFailure }}
        </p>

        <PublicationSettingsForm
          v-if="editingSettings"
          :key="overview.settings.revision"
          :settings="overview.settings"
          :disabled="settingsDisabled"
          @save="submitSettings"
          @cancel="closeSettings"
        />
      </template>
    </UModal>
  </NuxtLayout>
</template>
