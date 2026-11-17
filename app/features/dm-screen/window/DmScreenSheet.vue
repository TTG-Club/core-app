<script setup lang="ts">
  import type { SheetKeyTarget } from '~character-sheet/model';

  import { useCharacterSheet } from '~character-sheet/composables';
  import { CharacterSheetHost } from '~character-sheet/host';
  import {
    createSheetKey,
    DRAFT_CHARACTER_ID,
    getSheetPagePath,
  } from '~character-sheet/model';

  /**
   * Лист персонажа в окне ширмы — тот же лист, что на своей странице: свой
   * правится и сохраняется, чужой по ссылке открыт на просмотр. Листов на
   * ширме может быть несколько, у каждого своё состояние и своё сохранение.
   *
   * Крестик и «развернуть» даёт шапка окна, поэтому свои у листа скрыты.
   */
  const { sheet } = defineProps<{
    /**
     * Чей лист и чем он открывается; при смене листа компонент создаётся
     * заново, поэтому лист задаётся один раз.
     */
    sheet: SheetKeyTarget;
  }>();

  const emit = defineEmits<{
    /** Лист загрузился или его переименовали: имя персонажа для шапки окна. */
    loaded: [title: string];
    /** В этом окне нужно показать тот же лист по другому адресу. */
    navigate: [path: string];
    /** Показывать больше нечего: окно можно закрыть. */
    close: [];
  }>();

  const characterId = sheet.source === 'own' ? sheet.id : undefined;
  const shareToken = sheet.source === 'shared' ? sheet.id : undefined;

  const { character } = useCharacterSheet(createSheetKey(sheet));

  // Пока лист не загружен, в состоянии лежит пустой черновик: его имя шапке
  // окна не нужно
  watchImmediate(
    () => character.value,
    (loaded) => {
      if (loaded.id !== DRAFT_CHARACTER_ID) {
        emit('loaded', loaded.name);
      }
    },
  );

  /**
   * Право на правки листа выдали или отозвали: окно показывает тот же лист
   * по-новому — как свой или по ссылке. Без ссылки показывать нечего.
   * @param target - чей лист и чем он открывается; `null` — листа нет
   */
  function handleRetarget(target: SheetKeyTarget | null): void {
    if (target) {
      emit('navigate', getSheetPagePath(target));
    } else {
      emit('close');
    }
  }
</script>

<template>
  <CharacterSheetHost
    :character-id
    :share-token
    :can-close="false"
    @retarget="handleRetarget"
  />
</template>
