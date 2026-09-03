<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { useParticipantNames } from '~find-game/composables';
  import { getFindGameErrorMessage } from '~find-game/model';
  import { useNexusList } from '~nexus/composables';
  import {
    createNexus,
    getNexusRoute,
    NEXUS_CREATE_LABEL,
    NEXUS_CREATED_TOAST,
    NEXUS_EMPTY_DESCRIPTION,
    NEXUS_EMPTY_TITLE,
    NEXUS_ERROR_TITLE,
    NEXUS_LIST_DESCRIPTION,
    NEXUS_LIST_TITLE,
    NEXUS_NAVIGATION_LABEL,
    NEXUS_UNKNOWN_ERROR_MESSAGE,
  } from '~nexus/model';
  import { NexusCard, NexusCreateModal } from '~nexus/ui';
  import { PageGrid } from '~ui/page';
  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({
    title: NEXUS_NAVIGATION_LABEL,
    description: NEXUS_LIST_DESCRIPTION,
  });

  const toast = useToast();

  const {
    error,
    isEmpty,
    isLoading,
    nexuses,
    page,
    pageSize,
    refresh,
    status,
    totalNexuses,
  } = useNexusList();

  const isError = computed(() => status.value === 'error');

  const isCreateOpen = ref(false);
  const isBusy = ref(false);

  // Пагинация Nuxt UI считает страницы с единицы, сервис — с нуля.
  const humanPage = computed({
    get: () => page.value + 1,
    set: (value: number) => {
      page.value = Math.max(0, value - 1);
    },
  });

  const { getParticipantName, resolveNames } = useParticipantNames();

  // Имена владельцев живут в core-api, поэтому резолвятся отдельно и сразу на
  // всю страницу выдачи.
  watch(
    nexuses,
    (list) => {
      void resolveNames(list.map((item) => item.ownerId));
    },
    { immediate: true },
  );

  /**
   * Заводит комнату и сразу открывает её: заполнять список ради одной строки
   * незачем — владелец идёт туда звать людей.
   * @param request Название комнаты.
   */
  async function handleCreate(
    ...args: Parameters<typeof createNexus>
  ): Promise<void> {
    isBusy.value = true;

    try {
      const nexus = await createNexus(...args);

      toast.add({
        title: NEXUS_CREATED_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });

      isCreateOpen.value = false;

      await navigateTo(getNexusRoute(nexus.id));
    } catch (cause) {
      toast.add({
        title: NEXUS_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(cause),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isBusy.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="NEXUS_LIST_TITLE"
  >
    <template #actions>
      <UButton
        size="sm"
        icon="tabler:plus"
        :label="NEXUS_CREATE_LABEL"
        @click.left.exact.prevent="isCreateOpen = true"
      />
    </template>

    <div class="flex flex-col gap-4">
      <p class="text-sm text-muted">{{ NEXUS_LIST_DESCRIPTION }}</p>

      <PageGrid
        v-if="isLoading"
        :columns="3"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-48 w-full rounded-lg"
        />
      </PageGrid>

      <UiResult
        v-else-if="isError"
        status="error"
        :title="NEXUS_ERROR_TITLE"
        :sub-title="getFindGameErrorMessage(error)"
      >
        <template #extra>
          <UButton
            icon="tabler:refresh"
            label="Повторить"
            @click.left.exact.prevent="refresh()"
          />
        </template>
      </UiResult>

      <UiResult
        v-else-if="isEmpty"
        status="info"
        :title="NEXUS_EMPTY_TITLE"
        :sub-title="NEXUS_EMPTY_DESCRIPTION"
      />

      <template v-else>
        <PageGrid :columns="3">
          <NexusCard
            v-for="nexus in nexuses"
            :key="nexus.id"
            :nexus="nexus"
            :owner-name="getParticipantName(nexus.ownerId)"
          />
        </PageGrid>

        <UiPagination
          v-model:page="humanPage"
          :total="totalNexuses"
          :items-per-page="pageSize"
        />
      </template>
    </div>

    <NexusCreateModal
      v-model:open="isCreateOpen"
      :loading="isBusy"
      @submit="handleCreate"
    />
  </NuxtLayout>
</template>
