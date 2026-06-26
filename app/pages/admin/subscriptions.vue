<script setup lang="ts">
  import type {
    CreateCodesRequest,
    RedemptionCodeResponse,
  } from '~admin/subscriptions/model';

  import { useSubscriptionCodes } from '~admin/subscriptions/composables';
  import {
    CODE_STATUS_FILTER_OPTIONS,
    getCodeStatus,
    SUBSCRIPTION_CODES_API_PATH,
  } from '~admin/subscriptions/model';
  import { CodeRow, CodesPanel } from '~admin/subscriptions/ui';

  useSeoMeta({
    title: 'Промокоды: Настройки',
  });

  const { isSplitActive } = useLayoutWidth();
  const route = useRoute();
  const router = useRouter();
  const requestFetch = useRequestFetch();

  const { data: codes, status } = await useAsyncData<RedemptionCodeResponse[]>(
    'admin-subscription-codes',
    () => requestFetch(SUBSCRIPTION_CODES_API_PATH),
    { default: () => [] },
  );

  const isCodesLoading = computed(() => status.value === 'pending');

  // Выбранный код синхронизирован с ?id, режим создания — с ?create=1.
  const selectedId = computed<string | null>(() => {
    const id = route.query.id;

    return typeof id === 'string' && id ? id : null;
  });

  const selectedCode = computed(
    () => codes.value?.find((code) => code.id === selectedId.value) ?? null,
  );

  const isCreateMode = computed(() => route.query.create === '1');

  function selectCode(id: string): void {
    router.replace({ query: { ...route.query, id, create: undefined } });
  }

  function openCreate(): void {
    router.replace({ query: { ...route.query, create: '1', id: undefined } });
  }

  function closePanel(): void {
    router.replace({
      query: { ...route.query, id: undefined, create: undefined },
    });
  }

  // Фильтр списка по статусу.
  const statusFilter = ref<string>('all');

  const filteredCodes = computed(() => {
    const list = codes.value ?? [];

    if (statusFilter.value === 'all') {
      return list;
    }

    return list.filter((code) => getCodeStatus(code) === statusFilter.value);
  });

  // Мутации.
  const { isCreating: isSubmitting, createCodes } = useSubscriptionCodes();

  async function handleCreate(payload: CreateCodesRequest): Promise<void> {
    const created = await createCodes(payload);

    if (created) {
      // Дописываем новые коды в начало списка без перезагрузки всего списка.
      if (codes.value) {
        codes.value = [...created, ...codes.value];
      }

      closePanel();
    }
  }

  function onCodeUpdated(updated: RedemptionCodeResponse): void {
    if (!codes.value) {
      return;
    }

    codes.value = codes.value.map((code) =>
      code.id === updated.id ? updated : code,
    );
  }

  // Дровер для стандартного режима (в split-режиме деталь живёт в #detail).
  const isPanelOpen = computed({
    get: () =>
      !isSplitActive.value && (isCreateMode.value || !!selectedCode.value),
    set: (open: boolean) => {
      if (!open) {
        closePanel();
      }
    },
  });
</script>

<template>
  <div>
    <NuxtLayout
      name="section"
      title="Промокоды"
    >
      <!-- Управление -->
      <template #controls>
        <div class="flex flex-col gap-3">
          <UButton
            icon="tabler:plus"
            block
            @click.left.exact.prevent="openCreate"
          >
            Создать код
          </UButton>

          <USelectMenu
            v-model="statusFilter"
            :items="CODE_STATUS_FILTER_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </div>
      </template>

      <!-- Список кодов -->
      <template #default>
        <div
          v-if="isCodesLoading"
          class="space-y-2"
        >
          <USkeleton
            v-for="index in 6"
            :key="index"
            class="h-14 w-full rounded-xl"
          />
        </div>

        <div
          v-else-if="filteredCodes.length"
          class="flex flex-col gap-2"
        >
          <CodeRow
            v-for="code in filteredCodes"
            :key="code.id"
            :code="code"
            :is-opened="selectedId === code.id"
            @select="selectCode"
            @updated="onCodeUpdated"
          />
        </div>

        <div
          v-else
          class="py-12 text-center text-secondary"
        >
          {{
            codes?.length
              ? 'Нет кодов с таким статусом'
              : 'Кодов пока нет — создайте первый'
          }}
        </div>
      </template>

      <!-- Деталь (широкий режим) -->
      <template #detail>
        <CodesPanel
          :create-mode="isCreateMode"
          :code="selectedCode"
          :submitting="isSubmitting"
          @submit="handleCreate"
          @updated="onCodeUpdated"
          @close="closePanel"
        />
      </template>
    </NuxtLayout>

    <!-- Дровер (стандартный режим) -->
    <USlideover
      v-model:open="isPanelOpen"
      :close="false"
      :ui="{ content: 'w-full max-w-2xl' }"
    >
      <template #content>
        <CodesPanel
          :create-mode="isCreateMode"
          :code="selectedCode"
          :submitting="isSubmitting"
          @submit="handleCreate"
          @updated="onCodeUpdated"
          @close="closePanel"
        />
      </template>
    </USlideover>
  </div>
</template>
