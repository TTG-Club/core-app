<script setup lang="ts">
  import type { CreateAction } from '~bestiary/model';

  import {
    createEmptyCreatureAction,
    getCreatureActionCombatFilledCount,
  } from '~bestiary/model';

  import {
    CREATURE_ACTION_ENTRY,
    CREATURE_ACTION_LABELS,
    CREATURE_FORMULA_ERROR,
    CREATURE_FORMULA_FORBIDDEN_TOKENS,
  } from '../../constants';
  import CreatureActionEntry from './CreatureActionEntry.vue';

  defineProps<{
    /** Подпись кнопки добавления: «Добавить действие», «Добавить реакцию». */
    addLabel: string;

    /**
     * Путь списка в состоянии формы существа: `actions`, `legendary.actions`,
     * `lair.effects`. Из него собирается путь записи для вложенной формы —
     * без него родительское сохранение не прогонит схему записи.
     */
    path: string;
  }>();

  const model = defineModel<Array<CreateAction>>({ default: () => [] });

  const { isExpanded, toggle, expand, dropRow, getToggleIcon } =
    useExpandedRows();

  /** Индекс записи, удаление которой ждёт подтверждения. */
  const pendingRemoval = ref<number | undefined>(undefined);

  /**
   * Открыто ли подтверждение удаления. Закрытие любым способом — кнопкой,
   * «Escape», нажатием мимо окна — снимает отметку записи, поэтому у
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
   * Схема записи: формулы существа не знают @-токенов листа персонажа.
   *
   * Проверка стоит на списке частей, а не на каждой формуле: путь ошибки
   * `effect.damageParts` совпадает с именем поля вокруг списка, и сообщение
   * встаёт прямо под ним. Имена полей внутри записи считаются от пути записи.
   *
   * Схема живёт на строке списка, а не на её содержимом: вложенная форма
   * проверяет своё состояние, а не отрисованные поля, — и свёрнутая запись,
   * поля которой сняты с монтирования, всё равно проверяется при сохранении.
   */
  const actionSchema = z.object({
    effect: z.object({
      damageParts: z
        .array(z.object({ formula: z.string() }))
        .refine(
          (parts) =>
            parts.every(
              (part) => !CREATURE_FORMULA_FORBIDDEN_TOKENS.test(part.formula),
            ),
          { message: CREATURE_FORMULA_ERROR },
        ),
    }),
  });

  /**
   * Подпись бейджа боевой механики.
   *
   * @param action запись строки.
   * @returns подпись либо `undefined`, когда механики нет.
   */
  function getCombatBadge(action: CreateAction): string | undefined {
    const filledCount = getCreatureActionCombatFilledCount(action.effect);

    return filledCount
      ? `${CREATURE_ACTION_ENTRY.combatBadge}${filledCount}`
      : undefined;
  }

  /**
   * Подпись бейджа эффектов записи.
   *
   * @param action запись строки.
   * @returns подпись либо `undefined`, когда эффектов нет.
   */
  function getEffectsBadge(action: CreateAction): string | undefined {
    const effectsCount = action.effect.activeEffects.length;

    return effectsCount
      ? `${CREATURE_ACTION_ENTRY.effectsBadge}${effectsCount}`
      : undefined;
  }

  /**
   * Строки списка: запись и подписи её шапки. Вычисляемым списком, а не
   * вызовами в шаблоне — иначе каждая подпись считалась бы дважды на строку
   * (сначала на `v-if` бейджа, потом на его вывод) при каждой перерисовке.
   */
  const rows = computed(() =>
    model.value.map((action) => ({
      action,
      title: action.name.rus || CREATURE_ACTION_ENTRY.unnamed,
      combatBadge: getCombatBadge(action),
      effectsBadge: getEffectsBadge(action),
    })),
  );

  /** Заводит пустую запись в конце списка и сразу раскрывает её. */
  function addAction() {
    // Индекс считается ДО записи: после `push` он совпал бы уже с длиной
    // списка, и раскрылась бы несуществующая строка.
    const addedIndex = model.value.length;

    model.value.push(createEmptyCreatureAction());

    // Новая запись сразу раскрыта: её всё равно тут же заполняют.
    expand(addedIndex);
  }

  /**
   * Запрашивает подтверждение удаления записи.
   *
   * Спрашиваем, потому что строка сворачивается: за свёрнутой шапкой не видно
   * ни описания, ни механики, и промах по соседней кнопке стирал бы их молча.
   *
   * @param index позиция записи в списке.
   */
  function askRemoveAction(index: number) {
    pendingRemoval.value = index;
  }

  /** Удаляет запись после подтверждения и пересдвигает раскрытые строки. */
  function confirmRemoveAction() {
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
   * Заменяет запись целиком.
   *
   * Запись правится по полям и приезжает тем же объектом, но присваивание
   * оставлено: `v-model` по индексу массива компилируется в него же, а через
   * обработчик выражение остаётся обычным JavaScript.
   *
   * @param index позиция записи в списке.
   * @param action новая запись.
   */
  function updateAction(index: number, action: CreateAction) {
    model.value[index] = action;
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Форма записи оборачивает всю строку, а не её содержимое: свёрнутая
      строка снимает поля с монтирования, а проверка формул обязана дожить до
      сохранения -->
    <UForm
      v-for="(row, actionIndex) in rows"
      :key="actionIndex"
      class="rounded-lg border border-default bg-elevated/20"
      nested
      :name="`${path}.${actionIndex}`"
      :schema="actionSchema"
    >
      <div
        class="relative flex items-center gap-2 px-3 py-2 transition-colors hover:bg-elevated/40"
      >
        <!-- Нажатие ловит накладка во всю строку — псевдоэлемент кнопки от
          края до края: попадать в один значок приходилось прицельно. Значок
          свёртки от накладки не поднят, поэтому и он разворачивает строку.
          Кнопка удаления поднята над ней `relative` -->
        <button
          type="button"
          class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-expanded="isExpanded(actionIndex)"
          @click.left.exact.prevent="toggle(actionIndex)"
        >
          <span class="min-w-0 flex-1 truncate text-left text-base">
            {{ row.title }}
          </span>

          <UBadge
            v-if="row.combatBadge"
            size="sm"
            color="primary"
            variant="subtle"
            class="shrink-0"
          >
            {{ row.combatBadge }}
          </UBadge>

          <UBadge
            v-if="row.effectsBadge"
            size="sm"
            color="neutral"
            variant="subtle"
            class="shrink-0"
          >
            {{ row.effectsBadge }}
          </UBadge>
        </button>

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          class="relative shrink-0"
          :aria-label="CREATURE_ACTION_LABELS.remove"
          @click.left.exact.prevent="askRemoveAction(actionIndex)"
        />

        <UIcon
          :name="getToggleIcon(actionIndex)"
          class="size-4 shrink-0 text-dimmed"
        />
      </div>

      <div
        v-if="isExpanded(actionIndex)"
        class="grid grid-cols-24 gap-4 border-t border-default p-3"
      >
        <CreatureActionEntry
          :model-value="row.action"
          @update:model-value="updateAction(actionIndex, $event)"
        />
      </div>
    </UForm>

    <div class="flex justify-center">
      <UButton
        icon="tabler:plus"
        variant="soft"
        @click.left.exact.prevent="addAction"
      >
        {{ addLabel }}
      </UButton>
    </div>
  </div>

  <UModal
    v-model:open="isRemovalOpen"
    :title="CREATURE_ACTION_ENTRY.removeConfirmTitle"
    :description="CREATURE_ACTION_ENTRY.removeConfirmText"
  >
    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="isRemovalOpen = false"
        >
          {{ CREATURE_ACTION_ENTRY.removeConfirmCancel }}
        </UButton>

        <UButton
          color="error"
          icon="tabler:trash"
          @click.left.exact.prevent="confirmRemoveAction"
        >
          {{ CREATURE_ACTION_ENTRY.removeConfirmApply }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
