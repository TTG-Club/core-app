<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { getFindGameErrorMessage } from '~find-game/model';
  import {
    getNexusRoute,
    joinNexus,
    NEXUS_JOIN_FAILED_TITLE,
    NEXUS_JOIN_TITLE,
    NEXUS_JOINED_TOAST,
    NEXUS_NOT_FOUND_DESCRIPTION,
    NEXUS_ROUTE,
  } from '~nexus/model';
  import { UiResult } from '~ui/result';

  /**
   * Вход по ссылке-приглашению.
   *
   * Своего содержимого у страницы нет: переход по ссылке и есть согласие
   * войти, поэтому она сразу зовёт сервис и уводит в саму комнату. Экран
   * остаётся только на время запроса и на случай отказа.
   */
  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({
    title: NEXUS_JOIN_TITLE,
  });

  const route = useRoute();
  const toast = useToast();

  const inviteCode = computed(() => {
    const raw = route.params.inviteCode;

    return typeof raw === 'string' && raw ? raw : null;
  });

  const failure = ref<string | null>(null);

  const { status } = await useAsyncData(
    () => `nexus-join-${inviteCode.value ?? 'none'}`,
    async () => {
      const code = inviteCode.value;

      if (!code) {
        failure.value = NEXUS_NOT_FOUND_DESCRIPTION;

        return null;
      }

      try {
        const nexus = await joinNexus(code);

        toast.add({
          title: NEXUS_JOINED_TOAST,
          color: 'success',
          icon: 'tabler:door-enter',
        });

        await navigateTo(getNexusRoute(nexus.id), { replace: true });

        return nexus;
      } catch (cause) {
        failure.value = getFindGameErrorMessage(cause);

        return null;
      }
    },
    // Только на клиенте: приглашение принимают от имени пользователя, а на
    // сервере токена ещё нет.
    { server: false, deep: false },
  );

  const isJoining = computed(() => !failure.value && status.value !== 'error');
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="NEXUS_JOIN_TITLE"
    :back-to="NEXUS_ROUTE"
  >
    <USkeleton
      v-if="isJoining"
      class="h-40 w-full rounded-lg"
    />

    <UiResult
      v-else
      status="error"
      :title="NEXUS_JOIN_FAILED_TITLE"
      :sub-title="failure ?? NEXUS_NOT_FOUND_DESCRIPTION"
    >
      <template #extra>
        <UButton
          :to="NEXUS_ROUTE"
          icon="tabler:arrow-left"
          label="К моим комнатам"
        />
      </template>
    </UiResult>
  </NuxtLayout>
</template>
