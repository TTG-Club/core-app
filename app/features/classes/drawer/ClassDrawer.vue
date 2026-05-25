<script setup lang="ts">
  import type { ClassDetailResponse } from '../model';

  import { ClassBody } from '~classes/body';
  import { UiDrawer } from '~ui/drawer';

  const props = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  /** Текущий URL класса/подкласса — может меняться при inline-навигации */
  const currentUrl = ref(props.url);

  const { data: detail, status } = await useAsyncData(
    computed(() => `classes-${currentUrl.value}`),
    () => $fetch<ClassDetailResponse>(`/api/v2/classes/${currentUrl.value}`),
    {
      server: false,
      immediate: true,
      watch: [currentUrl],
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  const urlForCopy = computed(
    () => `${getOrigin()}/classes/${currentUrl.value}`,
  );

  const editUrl = computed(() => `/workshop/classes/${currentUrl.value}`);

  /**
   * Обработчик inline-навигации — обновляет текущий URL,
   * что триггерит перезагрузку данных через watch в useAsyncData.
   */
  function handleNavigate(classUrl: string): void {
    currentUrl.value = classUrl;
  }
</script>

<template>
  <UiDrawer
    :title="detail?.name.rus"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <ClassBody
      v-if="detail"
      :detail="detail"
      navigate-in-place
      @navigate="handleNavigate"
    />
  </UiDrawer>
</template>
