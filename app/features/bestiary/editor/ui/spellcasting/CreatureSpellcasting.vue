<script setup lang="ts">
  import type { CreatureSpellcastingBlock } from '../../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    createEmptyCreatureSpellcastingBlock,
    getCreatureSpellcastingSpellCount,
  } from '../../../model';
  import {
    CREATURE_SPELLCASTING_EDITOR,
    SPELLCASTING_FIELD_PATH,
  } from '../../constants';
  import CreatureSpellcastingEntry from './CreatureSpellcastingEntry.vue';

  /**
   * Заклинания существа блоками.
   *
   * Блок — это набор заклинаний с общими заклинательной характеристикой, Сл и
   * бонусом атаки; внутри блока заклинания разложены группами по ограничению
   * применений. На карточку сайта блоки не выводятся: там заклинания
   * по-прежнему описывает текст записи, а блоки заведены ради виртуального
   * стола, где у существа своя вкладка заклинаний.
   *
   * Строки свёрнуты, как у боевого блока: у заполненного существа их несколько,
   * и раскрытыми они занимали бы экран целиком.
   */
  const model = defineModel<Array<CreatureSpellcastingBlock>>({
    required: true,
  });

  const { isExpanded, toggle, expand, dropRow, getToggleIcon } =
    useExpandedRows();

  /** Номер блока, удаление которого ждёт подтверждения. */
  const pendingRemoval = ref<number | undefined>(undefined);

  /**
   * Открыто ли подтверждение удаления. Закрытие любым способом — кнопкой,
   * «Escape», нажатием мимо окна — снимает отметку блока, поэтому у
   * вычисляемого свойства есть сеттер.
   */
  const isRemovalOpen = computed({
    get: () => pendingRemoval.value !== undefined,
    set: (open) => {
      if (!open) {
        pendingRemoval.value = undefined;
      }
    },
  });

  /**
   * Строки списка: блок и подписи его шапки. Вычисляемым списком, а не
   * вызовами в шаблоне — иначе бейджи считались бы заново на каждой
   * перерисовке.
   */
  const rows = computed(() =>
    model.value.map((block) => {
      const spellCount = getCreatureSpellcastingSpellCount(block);

      return {
        block,
        title: block.name || CREATURE_SPELLCASTING_EDITOR.unnamed,
        groupsCount: block.groups.length,
        spellCount,
      };
    }),
  );

  /** Заводит пустой блок в конце списка и сразу раскрывает его. */
  function addBlock(): void {
    // Номер считается ДО записи: после `push` он совпал бы уже с длиной
    // списка, и раскрылась бы несуществующая строка.
    const addedIndex = model.value.length;

    model.value.push(createEmptyCreatureSpellcastingBlock());

    expand(addedIndex);
  }

  /**
   * Запрашивает подтверждение удаления блока.
   *
   * Спрашиваем, потому что строка сворачивается: за свёрнутой шапкой не видно
   * ни групп, ни списков заклинаний, и промах по кнопке стирал бы их молча.
   *
   * @param index - позиция блока в списке
   */
  function askRemoveBlock(index: number): void {
    pendingRemoval.value = index;
  }

  /** Удаляет блок после подтверждения и пересдвигает раскрытые строки. */
  function confirmRemoveBlock(): void {
    const index = pendingRemoval.value;

    pendingRemoval.value = undefined;

    if (index === undefined) {
      return;
    }

    model.value.splice(index, 1);

    // Без сдвига раскрытым оказался бы сосед, занявший освободившийся номер.
    dropRow(index);
  }

  /**
   * Заменяет блок целиком.
   *
   * Блок правится по полям и приезжает тем же объектом, но присваивание
   * оставлено: без обработчика обновления `defineModel` строки ушёл бы в
   * локальный режим.
   *
   * @param index - позиция блока в списке
   * @param block - новый блок
   */
  function updateBlock(index: number, block: CreatureSpellcastingBlock): void {
    model.value[index] = block;
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <InfoTooltip
        :text="CREATURE_SPELLCASTING_EDITOR.hint"
        icon="tabler:info-circle-filled"
      >
        <h2 class="truncate text-base text-highlighted">
          {{ CREATURE_SPELLCASTING_EDITOR.title }}
        </h2>
      </InfoTooltip>
    </template>

    <div class="flex flex-col gap-3">
      <p
        v-if="!rows.length"
        class="text-sm text-dimmed italic"
      >
        {{ CREATURE_SPELLCASTING_EDITOR.empty }}
      </p>

      <!-- Форма блока оборачивает всю строку, а не её содержимое: имена полей
        внутри считаются от пути блока, иначе поле `name` блока совпало бы с
        названием самого существа -->
      <UForm
        v-for="(row, blockIndex) in rows"
        :key="blockIndex"
        class="rounded-lg border border-default bg-elevated/20"
        nested
        :name="`${SPELLCASTING_FIELD_PATH}.${blockIndex}`"
      >
        <div
          class="relative flex items-center gap-2 px-3 py-2 transition-colors hover:bg-elevated/40"
        >
          <!-- Нажатие ловит накладка во всю строку — псевдоэлемент кнопки от
            края до края: попадать в один значок приходилось прицельно. Кнопка
            удаления поднята над накладкой `relative` -->
          <button
            type="button"
            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-expanded="isExpanded(blockIndex)"
            @click.left.exact.prevent="toggle(blockIndex)"
          >
            <span class="min-w-0 flex-1 truncate text-left text-base">
              {{ row.title }}
            </span>

            <!-- Значок с числом, а не подпись: на телефоне две полные подписи
              съедали строку, и от названия блока оставалось «Испол…». Что
              значит число, говорит подсказка -->
            <UBadge
              v-if="row.groupsCount"
              size="sm"
              color="neutral"
              variant="subtle"
              class="shrink-0 tabular-nums"
              :icon="CREATURE_SPELLCASTING_EDITOR.groupsBadgeIcon"
              :title="CREATURE_SPELLCASTING_EDITOR.groupsBadgeTitle"
            >
              {{ row.groupsCount }}
            </UBadge>

            <UBadge
              v-if="row.spellCount"
              size="sm"
              color="primary"
              variant="subtle"
              class="shrink-0 tabular-nums"
              :icon="CREATURE_SPELLCASTING_EDITOR.spellsBadgeIcon"
              :title="CREATURE_SPELLCASTING_EDITOR.spellsBadgeTitle"
            >
              {{ row.spellCount }}
            </UBadge>
          </button>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            class="relative shrink-0"
            :aria-label="CREATURE_SPELLCASTING_EDITOR.removeBlock"
            @click.left.exact.prevent="askRemoveBlock(blockIndex)"
          />

          <UIcon
            :name="getToggleIcon(blockIndex)"
            class="size-4 shrink-0 text-dimmed"
          />
        </div>

        <!-- Не сетка в 24 колонки, как у боевого блока: 23 её отступа по 16px
          дают полу в 368px, и на телефоне карточка вылезала за экран. Поля
          блока раскладывает flex-wrap -->
        <div
          v-if="isExpanded(blockIndex)"
          class="border-t border-default p-3"
        >
          <CreatureSpellcastingEntry
            :model-value="row.block"
            @update:model-value="updateBlock(blockIndex, $event)"
          />
        </div>
      </UForm>

      <div class="flex justify-center">
        <UButton
          icon="tabler:plus"
          variant="soft"
          @click.left.exact.prevent="addBlock"
        >
          {{ CREATURE_SPELLCASTING_EDITOR.addBlock }}
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="isRemovalOpen"
      :title="CREATURE_SPELLCASTING_EDITOR.removeConfirmTitle"
      :description="CREATURE_SPELLCASTING_EDITOR.removeConfirmText"
    >
      <template #footer>
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="isRemovalOpen = false"
          >
            {{ CREATURE_SPELLCASTING_EDITOR.removeConfirmCancel }}
          </UButton>

          <UButton
            color="error"
            icon="tabler:trash"
            @click.left.exact.prevent="confirmRemoveBlock"
          >
            {{ CREATURE_SPELLCASTING_EDITOR.removeConfirmApply }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
