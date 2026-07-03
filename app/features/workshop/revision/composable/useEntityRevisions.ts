import type { WorkshopRevisionControl } from '../model';

import {
  entityRevisionDetailSchema,
  entityRevisionListSchema,
  REVISION_LOAD_ERROR_DESCRIPTION,
  REVISION_LOAD_ERROR_TITLE,
} from '../model';

interface EntityRevisionOptions {
  entityType: string | undefined;
  entityId: MaybeRefOrGetter<string | undefined>;
  enabled: MaybeRefOrGetter<boolean>;
  applySnapshot: (snapshot: Record<string, unknown>) => void;
}

/**
 * Управляет загрузкой списка ревизий и подстановкой выбранного снимка.
 */
export function useEntityRevisions(options: EntityRevisionOptions) {
  const toast = useToast();
  const selectedVersion = ref<number>();
  const snapshotLoading = ref(false);

  const revisionUrl = computed(() => {
    const entityId = toValue(options.entityId);

    if (!options.entityType || !entityId) {
      return undefined;
    }

    return `/api/v2/revisions/${options.entityType}/${entityId}`;
  });

  const {
    data: revisions,
    status: revisionListStatus,
    refresh,
  } = useAsyncData(
    `workshop-revisions-${options.entityType ?? 'unsupported'}-${toValue(options.entityId) ?? 'create'}`,
    async () => {
      if (!toValue(options.enabled) || !revisionUrl.value) {
        return [];
      }

      const response = await $fetch<unknown>(revisionUrl.value);

      return entityRevisionListSchema.parse(response);
    },
    { default: () => [] },
  );

  const loading = computed(
    () => revisionListStatus.value === 'pending' || snapshotLoading.value,
  );

  /**
   * Загружает выбранную ревизию после строгой проверки идентификаторов.
   */
  async function selectRevision(version: number): Promise<void> {
    const entityId = toValue(options.entityId);

    if (!toValue(options.enabled) || !revisionUrl.value || !entityId) {
      return;
    }

    snapshotLoading.value = true;

    try {
      const response = await $fetch<unknown>(`${revisionUrl.value}/${version}`);
      const revision = entityRevisionDetailSchema.parse(response);

      if (
        revision.entityType !== options.entityType
        || revision.entityId !== entityId
        || revision.version !== version
      ) {
        throw new Error('Revision entity identity mismatch');
      }

      options.applySnapshot(revision.snapshot);
      selectedVersion.value = version;
    } catch (error) {
      consola.error(error);
      selectedVersion.value = undefined;

      toast.add({
        title: REVISION_LOAD_ERROR_TITLE,
        description: REVISION_LOAD_ERROR_DESCRIPTION,
        color: 'error',
      });
    } finally {
      snapshotLoading.value = false;
    }
  }

  const revisionControl = computed<WorkshopRevisionControl>(() => ({
    enabled: toValue(options.enabled),
    revisions: revisions.value,
    selectedVersion: selectedVersion.value,
    loading: loading.value,
    selectRevision,
  }));

  /**
   * Сбрасывает выбранную ревизию после загрузки актуального состояния формы.
   */
  function clearSelectedRevision(): void {
    selectedVersion.value = undefined;
  }

  return {
    revisionControl,
    refreshRevisions: refresh,
    clearSelectedRevision,
  };
}
