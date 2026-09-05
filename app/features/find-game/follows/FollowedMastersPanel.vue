<script setup lang="ts">
  import { UiResult } from '~ui/result';

  import {
    useFollows,
    useMasterProfileDrawer,
    useParticipantNames,
  } from '../composables';
  import {
    FOLLOW_MASTER_ACTIVE_LABEL,
    FOLLOWED_MASTERS_EMPTY_DESCRIPTION,
    FOLLOWED_MASTERS_EMPTY_TITLE,
    MASTER_PROFILE_OPEN_HINT,
  } from '../model';

  /**
   * Отмеченные мастера: их новые игры приходят уведомлением.
   *
   * Список — это и есть отслеживание: сама лента живёт в уведомлениях, а
   * здесь видно, за кем следишь, и отсюда же отметку снимают.
   */
  const { busyUserId, masters, isMastersLoading, toggleMaster } = useFollows();

  const { getParticipantName, resolveNames } = useParticipantNames();
  const masterDrawer = useMasterProfileDrawer();

  // Сервис поиска игр знает только идентификаторы: имена приезжают из core-api
  // и разом на весь список.
  watch(
    masters,
    (list) => {
      void resolveNames(list.map((follow) => follow.userId));
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="isMastersLoading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-14 w-full rounded-lg"
      />
    </div>

    <UiResult
      v-else-if="!masters.length"
      status="info"
      :title="FOLLOWED_MASTERS_EMPTY_TITLE"
      :sub-title="FOLLOWED_MASTERS_EMPTY_DESCRIPTION"
    />

    <template v-else>
      <div
        v-for="follow in masters"
        :key="follow.userId"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-default p-3"
      >
        <UButton
          variant="link"
          color="primary"
          class="p-0"
          icon="tabler:user"
          :title="MASTER_PROFILE_OPEN_HINT"
          :label="getParticipantName(follow.userId)"
          @click.left.exact.prevent="
            masterDrawer.open(follow.userId, getParticipantName(follow.userId))
          "
        />

        <UButton
          size="sm"
          color="primary"
          variant="subtle"
          icon="tabler:bookmark-filled"
          :loading="busyUserId === follow.userId"
          :label="FOLLOW_MASTER_ACTIVE_LABEL"
          @click.left.exact.prevent="toggleMaster(follow.userId)"
        />
      </div>
    </template>
  </div>
</template>
