<script setup lang="ts">
  import { useCharacterSheetEditors } from '../../composables';
  import { SHEET_EDITORS_LABELS } from '../../model';
  import SheetEditorRow from './SheetEditorRow.vue';

  /**
   * Запросы на редактирование открытого листа — у его владельца, над телом
   * листа. Ответить можно прямо здесь, не открывая модалку «Поделиться»: точка
   * у шлема и метка в списке ведут именно сюда.
   */
  const { sheetId } = defineProps<{
    sheetId: string;
  }>();

  const { isPending, getPendingRequests, canApproveMore, approve, remove } =
    useCharacterSheetEditors();

  const pendingRequests = computed(() => getPendingRequests(sheetId));

  const canApprove = computed(() => canApproveMore(sheetId));

  /**
   * Разрешает правки по запросу; ошибку показывает тостом композабл.
   *
   * @param editorId идентификатор запроса.
   */
  function handleApprove(editorId: string): void {
    void approve(sheetId, editorId);
  }

  /**
   * Отклоняет запрос; ошибку показывает тостом композабл.
   *
   * @param editorId идентификатор запроса.
   */
  function handleDecline(editorId: string): void {
    void remove(sheetId, editorId);
  }
</script>

<template>
  <div
    v-if="pendingRequests.length"
    class="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3"
  >
    <div class="flex items-start gap-2">
      <UIcon
        name="tabler:pencil-question"
        class="mt-0.5 size-5 shrink-0 text-primary"
      />

      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="text-sm font-semibold text-highlighted">
          {{ SHEET_EDITORS_LABELS.requestsTitle }}
        </span>

        <span class="text-xs text-muted">
          {{ SHEET_EDITORS_LABELS.requestsHint }}
        </span>
      </div>
    </div>

    <SheetEditorRow
      v-for="request in pendingRequests"
      :key="request.id"
      :editor="request"
      :can-approve="canApprove"
      :disabled="isPending"
      @approve="handleApprove"
      @remove="handleDecline"
    />
  </div>
</template>
