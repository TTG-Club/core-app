<script setup lang="ts">
  import type { SheetKeyTarget } from '../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { UiResult } from '~ui/result';

  import { CharacterSheetBody, CharacterSheetSkeleton } from '../body';
  import {
    useCharacterSheet,
    useCharacterSheetAutosave,
    useCharacterSheetList,
    useCharacterSheetLoader,
  } from '../composables';
  import {
    createSheetKey,
    SHEET_HOST_LABELS,
    SHEET_NOT_FOUND_SUBTITLES,
    SHEET_NOT_FOUND_TITLES,
  } from '../model';

  /**
   * Лист персонажа целиком: загрузка, автосохранение и само тело листа.
   * Один и тот же хост стоит на странице листа, в правой панели списка, в
   * дровере и в окне ширмы — контейнер лишь говорит, какой лист показать, и
   * решает, что значит «закрыть» и «развернуть».
   *
   * Свой лист задаётся идентификатором, чужой — токеном ссылки: по ней лист
   * открыт только на просмотр и не сохраняется. Контейнер обязан менять
   * `key` хоста вместе с листом: лист задаётся один раз, при создании.
   */
  const {
    characterId = '',
    shareToken = '',
    canExpand = false,
    canClose = true,
  } = defineProps<{
    /** Идентификатор своего листа. */
    characterId?: string;

    /** Токен ссылки чужого листа; задан — лист открыт на просмотр. */
    shareToken?: string;

    /** Показать в шапке листа кнопку «развернуть на страницу». */
    canExpand?: boolean;

    /** Показать в шапке листа крестик: у дровера он свой. */
    canClose?: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
    expand: [];

    /**
     * Вместо этого листа нужно показать другой: тот же лист, но как свой
     * (право на правки выдали) или по ссылке (отозвали); `null` — показывать
     * больше нечего.
     */
    retarget: [target: SheetKeyTarget | null];
  }>();

  defineSlots<{
    /** Что предложить, когда лист не нашёлся: вернуться, закрыть. */
    notFoundActions?: () => unknown;
  }>();

  const isShared = Boolean(shareToken);

  // Под этим ключом лежит всё состояние листа: тело и его окна получают
  // ключ и работают со своим листом, сколько бы листов ни было открыто
  const sheetKey = createSheetKey(
    isShared
      ? { source: 'shared', id: shareToken }
      : { source: 'own', id: characterId },
  );

  const { status, load } = useCharacterSheetLoader(sheetKey);

  // Чужой лист по ссылке не правится: сохранять в нём нечего, а в списке
  // своих листов его нет
  if (!isShared) {
    useCharacterSheetAutosave(sheetKey);

    const { character } = useCharacterSheet(sheetKey);
    const { syncOpenSheet } = useCharacterSheetList();

    watch(character, syncOpenSheet);
  }

  const isPending = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const isNotFound = computed(() => status.value === 'notFound');

  const isFailed = computed(() => status.value === 'error');

  const notFoundTitle = isShared
    ? SHEET_NOT_FOUND_TITLES.shared
    : SHEET_NOT_FOUND_TITLES.own;

  const notFoundSubtitle = isShared
    ? SHEET_NOT_FOUND_SUBTITLES.shared
    : SHEET_NOT_FOUND_SUBTITLES.own;

  /** Лист просит закрыть его. */
  function handleClose(): void {
    emit('close');
  }

  /**
   * Лист просит показать вместо себя другой.
   * @param target - чей лист и чем он открывается; `null` — листа нет
   */
  function handleRetarget(target: SheetKeyTarget | null): void {
    emit('retarget', target);
  }

  /** Лист просит открыть его на отдельной странице. */
  function handleExpand(): void {
    emit('expand');
  }
</script>

<template>
  <CharacterSheetSkeleton v-if="isPending" />

  <UiResult
    v-else-if="isNotFound"
    status="404"
    :title="notFoundTitle"
    :sub-title="notFoundSubtitle"
  >
    <template #extra>
      <slot name="notFoundActions" />
    </template>
  </UiResult>

  <UiResult
    v-else-if="isFailed"
    status="error"
    :title="SHEET_HOST_LABELS.errorTitle"
  >
    <template #extra>
      <UButton @click.left.exact.prevent="load">
        {{ ACTION_LABELS.retry }}
      </UButton>
    </template>
  </UiResult>

  <CharacterSheetBody
    v-else
    :sheet-key
    :can-expand
    :can-close
    @close="handleClose"
    @expand="handleExpand"
    @retarget="handleRetarget"
  />
</template>
