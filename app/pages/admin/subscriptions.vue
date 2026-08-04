<script setup lang="ts">
  import type {
    CodeStatusFilterValue,
    CreateCodesRequest,
    RedemptionCodeResponse,
  } from '~admin/subscriptions/model';

  import { useSubscriptionCodes } from '~admin/subscriptions/composables';
  import {
    CODE_STATUS_FILTER_ALL,
    CODE_STATUS_FILTER_OPTIONS,
    CODES_CREATE_BUTTON_LABEL,
    CODES_EMPTY_FILTERED_TEXT,
    CODES_EMPTY_TEXT,
    CODES_LIST_DATA_KEY,
    CODES_LIST_SKELETON_COUNT,
    CODES_LOAD_ERROR_TEXT,
    CODES_PAGE_SEO_TITLE,
    CODES_PAGE_TITLE,
    CODES_RETRY_BUTTON_LABEL,
    CODES_SEARCH_CLEAR_LABEL,
    CODES_SEARCH_PLACEHOLDER,
    codesSearchEmptyText,
    getCodeStatus,
    SUBSCRIPTION_CODES_API_PATH,
  } from '~admin/subscriptions/model';
  import { CodeRow, CodesPanel } from '~admin/subscriptions/ui';

  useSeoMeta({
    title: CODES_PAGE_SEO_TITLE,
  });

  const { isSplitActive } = useLayoutWidth();
  const route = useRoute();
  const router = useRouter();
  const requestFetch = useRequestFetch();

  // server: false — приватные данные subscriber-service грузим на клиенте, где
  // авторизация (cookie → Bearer → subscriber) гарантированно работает. На SSR
  // запрос возвращался пустым, и Nuxt переиспользовал пустой payload после F5
  // (та же стратегия, что в profile/activation).
  const {
    data: codes,
    status,
    error,
    refresh,
  } = await useAsyncData<RedemptionCodeResponse[]>(
    CODES_LIST_DATA_KEY,
    () => requestFetch(SUBSCRIPTION_CODES_API_PATH),
    { default: () => [], server: false },
  );

  const isCodesLoading = computed(() => status.value === 'pending');
  const hasCodesError = computed(() => !!error.value);

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

  // Фильтр списка по статусу и поиск по коду/пометке/логину активировавшего.
  const statusFilter = ref<CodeStatusFilterValue>(CODE_STATUS_FILTER_ALL);
  const search = ref('');

  const trimmedSearch = computed(() => search.value.trim());

  const filteredCodes = computed(() => {
    let list = codes.value ?? [];

    if (statusFilter.value !== CODE_STATUS_FILTER_ALL) {
      list = list.filter((code) => getCodeStatus(code) === statusFilter.value);
    }

    const query = trimmedSearch.value.toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter(
      (code) =>
        code.code.toLowerCase().includes(query)
        || code.label?.toLowerCase().includes(query)
        || code.redeemedBy?.toLowerCase().includes(query),
    );
  });

  const emptyMessage = computed(() => {
    if (!codes.value?.length) {
      return CODES_EMPTY_TEXT;
    }

    if (trimmedSearch.value) {
      return codesSearchEmptyText(trimmedSearch.value);
    }

    return CODES_EMPTY_FILTERED_TEXT;
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
      :title="CODES_PAGE_TITLE"
    >
      <!-- Управление -->
      <template #controls>
        <div class="flex flex-col gap-3">
          <UButton
            icon="tabler:plus"
            block
            @click.left.exact.prevent="openCreate"
          >
            {{ CODES_CREATE_BUTTON_LABEL }}
          </UButton>

          <UInput
            v-model="search"
            icon="tabler:search"
            :placeholder="CODES_SEARCH_PLACEHOLDER"
            class="w-full"
            :ui="{ trailing: 'pe-0.5' }"
          >
            <template
              v-if="search"
              #trailing
            >
              <UButton
                icon="tabler:x"
                variant="link"
                color="neutral"
                size="sm"
                :aria-label="CODES_SEARCH_CLEAR_LABEL"
                @click.left.exact.prevent="search = ''"
              />
            </template>
          </UInput>

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
            v-for="index in CODES_LIST_SKELETON_COUNT"
            :key="index"
            class="h-14 w-full rounded-xl"
          />
        </div>

        <div
          v-else-if="hasCodesError"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <p class="text-sm text-error">{{ CODES_LOAD_ERROR_TEXT }}</p>

          <UButton
            icon="tabler:refresh"
            color="neutral"
            variant="soft"
            size="sm"
            @click.left.exact.prevent="() => refresh()"
          >
            {{ CODES_RETRY_BUTTON_LABEL }}
          </UButton>
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
          {{ emptyMessage }}
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
