<script setup lang="ts">
  import type {
    HitDiceAmount,
    HitDiceSelectPool,
    HitDieRollResult,
  } from '../../model';

  import { useDiceRoller } from '~dice-roller/composables';

  import { useCharacterSheet } from '../../composables';
  import {
    getHitDicePools,
    getHitDieFormula,
    getHitDieLabel,
    getHitDieRestore,
    getSelectedHitDice,
    getShortRestRecoveryLabels,
    RESOURCE_RECOVERY_ICONS,
    SHORT_REST_LABELS,
    SHORT_REST_RULES,
  } from '../../model';
  import SheetHitDiceSelect from './SheetHitDiceSelect.vue';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, spendHitDice, completeShortRest } = useCharacterSheet();

  // Кости хитов катятся напрямую роллером: результат каждой кости нужен здесь,
  // чтобы прибавить модификатор Телосложения и поднять хиты.
  const { rollValue } = useDiceRoller();

  const toast = useToast();

  const shortRestIcon = RESOURCE_RECOVERY_ICONS['short-rest'];

  const health = computed(() => character.value.health);

  // Цвет живого значения хитов: ноль — error, половина и меньше — warning.
  const hitPointsClass = computed(() => {
    if (health.value.current <= 0) {
      return 'text-error';
    }

    if (health.value.max > 0 && health.value.current * 2 <= health.value.max) {
      return 'text-warning';
    }

    return 'text-highlighted';
  });

  const isZeroHitPoints = computed(() => health.value.current <= 0);

  const constitutionModifier = computed(() =>
    getModifier(character.value.abilities.constitution),
  );

  const formattedConstitutionModifier = computed(() =>
    getFormattedModifier(character.value.abilities.constitution),
  );

  const hitDicePools = computed(() =>
    getHitDicePools(character.value.hitDice, character.value.extraHitDice),
  );

  /** Тратить можно только оставшиеся кости номинала. */
  const selectPools = computed<HitDiceSelectPool[]>(() =>
    hitDicePools.value.map((pool) => ({ ...pool, limit: pool.current })),
  );

  /** Выбранное к броску количество костей по номиналу. */
  const selectedCounts = ref<Record<number, number>>({});

  const spentDice = computed(() =>
    getSelectedHitDice(selectPools.value, selectedCounts.value),
  );

  const selectedTotal = computed(() =>
    spentDice.value.reduce((total, pool) => total + pool.count, 0),
  );

  const isRollDisabled = computed(() => selectedTotal.value === 0);

  const rollLabel = computed(() =>
    selectedTotal.value > 0
      ? `${SHORT_REST_LABELS.roll} (${selectedTotal.value})`
      : SHORT_REST_LABELS.roll,
  );

  /** Кости хитов заданы, но все потрачены — тратить на отдыхе нечего. */
  const isAllDiceSpent = computed(
    () =>
      hitDicePools.value.length > 0
      && hitDicePools.value.every((pool) => pool.current === 0),
  );

  const rollResults = ref<HitDieRollResult[]>([]);

  const restoredTotal = computed(() =>
    rollResults.value.reduce((total, result) => total + result.restored, 0),
  );

  const recoveryLabels = computed(() =>
    getShortRestRecoveryLabels(character.value),
  );

  /** Описание тоста об окончании отдыха: что именно вернулось персонажу. */
  const finishDescription = computed(() => {
    const parts: string[] = [];

    if (restoredTotal.value > 0) {
      parts.push(
        `${SHORT_REST_LABELS.finishedHitPoints}: ${restoredTotal.value}.`,
      );
    }

    if (recoveryLabels.value.length > 0) {
      parts.push(
        `${SHORT_REST_LABELS.finishedRecovery}: ${recoveryLabels.value.join(', ')}.`,
      );
    }

    return parts.length > 0 ? parts.join(' ') : SHORT_REST_LABELS.finishedEmpty;
  });

  /**
   * Бросок потраченных костей: каждая кость катится отдельно, потому что
   * минимум восстановления (ноль хитов) правила применяют к каждой кости, а
   * игрок видит результат каждого броска.
   *
   * @param spent потраченные кости по номиналам.
   * @returns результаты бросков по одной кости.
   */
  function rollHitDice(spent: HitDiceAmount[]): HitDieRollResult[] {
    const modifier = constitutionModifier.value;
    const formattedModifier = formattedConstitutionModifier.value;

    return spent.flatMap((pool) =>
      Array.from({ length: pool.count }, (): HitDieRollResult => {
        const rolled = rollValue(getHitDieFormula(pool.die));

        return {
          id: crypto.randomUUID(),
          label: getHitDieLabel(pool.die),
          rolled,
          formattedModifier,
          restored: getHitDieRestore(rolled, modifier),
        };
      }),
    );
  }

  /**
   * Трата выбранных костей хитов: кости списываются с листа, хиты растут на
   * сумму бросков одним действием, а сами броски пополняют журнал отдыха.
   */
  function handleRoll(): void {
    const spent = spentDice.value;

    if (spent.length === 0) {
      return;
    }

    const results = rollHitDice(spent);

    spendHitDice(
      spent,
      results.reduce((total, result) => total + result.restored, 0),
    );

    rollResults.value = [...rollResults.value, ...results];
    selectedCounts.value = {};
  }

  /**
   * Завершение отдыха: возвращает умения и ячейки короткого отдыха, показывает
   * итог тостом и закрывает модалку. Хиты и кости уже применены броском.
   */
  function handleFinish(): void {
    completeShortRest();

    toast.add({
      title: SHORT_REST_LABELS.finishedTitle,
      description: finishDescription.value,
      color: 'success',
      icon: shortRestIcon,
    });

    emit('close');
  }

  /** Закрытие без завершения отдыха: броски уже применены к листу. */
  function handleClose(): void {
    emit('close');
  }
</script>

<template>
  <UModal :title="SHORT_REST_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-toned">{{ SHORT_REST_LABELS.intro }}</p>

        <UCollapsible class="flex flex-col gap-2">
          <UButton
            :label="SHORT_REST_LABELS.rulesTitle"
            icon="tabler:book"
            trailing-icon="tabler:chevron-down"
            color="neutral"
            variant="subtle"
            size="sm"
            block
            class="group justify-between"
            :ui="{
              trailingIcon:
                'transition-transform duration-200 group-data-[state=open]:rotate-180',
            }"
          />

          <template #content>
            <ul class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
              <li
                v-for="rule in SHORT_REST_RULES"
                :key="rule"
                class="flex gap-1.5 text-xs leading-relaxed text-toned"
              >
                <UIcon
                  name="tabler:point-filled"
                  class="mt-1 size-3 shrink-0 text-warning"
                />

                <span>{{ rule }}</span>
              </li>
            </ul>
          </template>
        </UCollapsible>

        <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ SHORT_REST_LABELS.hitPointsTitle }}
              </span>

              <span class="flex items-end gap-1.5">
                <span
                  class="text-2xl leading-none font-bold tabular-nums"
                  :class="hitPointsClass"
                >
                  {{ health.current }}
                </span>

                <span class="text-sm leading-none text-muted">
                  / {{ health.max }}
                </span>

                <span
                  v-if="health.temporary > 0"
                  class="text-sm leading-none font-bold text-warning"
                >
                  +{{ health.temporary }}
                </span>
              </span>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ SHORT_REST_LABELS.constitutionTitle }}
              </span>

              <span
                class="text-2xl leading-none font-bold text-highlighted tabular-nums"
              >
                {{ formattedConstitutionModifier }}
              </span>
            </div>
          </div>

          <span
            class="border-t border-default/50 pt-2 text-[10px] text-dimmed"
            >{{ SHORT_REST_LABELS.constitutionHint }}</span
          >
        </div>

        <UAlert
          v-if="isZeroHitPoints"
          icon="tabler:alert-triangle"
          color="warning"
          variant="subtle"
          :title="SHORT_REST_LABELS.zeroHitPointsTitle"
          :description="SHORT_REST_LABELS.zeroHitPointsDescription"
        />

        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-baseline justify-between gap-x-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SHORT_REST_LABELS.diceTitle }}
            </span>

            <span class="text-xs text-dimmed">
              {{ SHORT_REST_LABELS.diceHint }}
            </span>
          </div>

          <template v-if="selectPools.length">
            <SheetHitDiceSelect
              v-model="selectedCounts"
              :pools="selectPools"
              :add-label="SHORT_REST_LABELS.diceAdd"
              :remove-label="SHORT_REST_LABELS.diceRemove"
            />

            <span
              v-if="isAllDiceSpent"
              class="text-xs text-dimmed italic"
            >
              {{ SHORT_REST_LABELS.spentDice }}
            </span>

            <UButton
              v-else
              :label="rollLabel"
              icon="ttg:dice-outline-d20"
              color="primary"
              variant="soft"
              block
              :disabled="isRollDisabled"
              @click.left.exact.prevent="handleRoll"
            />
          </template>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ SHORT_REST_LABELS.noDice }}
          </span>
        </div>

        <div
          v-if="rollResults.length"
          class="flex flex-col gap-2"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHORT_REST_LABELS.rollLogTitle }}
          </span>

          <div class="flex flex-col gap-1 rounded-lg bg-elevated/40 p-3">
            <div
              v-for="result in rollResults"
              :key="result.id"
              class="flex items-baseline justify-between gap-2 text-sm"
            >
              <span class="text-muted">
                {{ result.label }}: {{ result.rolled }}
                {{ result.formattedModifier }}
              </span>

              <span class="font-bold text-success">
                +{{ result.restored }}
              </span>
            </div>

            <div
              class="mt-1 flex items-baseline justify-between gap-2 border-t border-default/50 pt-2 text-sm"
            >
              <span class="font-medium text-toned">
                {{ SHORT_REST_LABELS.rollTotal }}
              </span>

              <span class="font-bold text-success">+{{ restoredTotal }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="recoveryLabels.length"
          class="flex flex-col gap-2"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHORT_REST_LABELS.recoveryTitle }}
          </span>

          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="label in recoveryLabels"
              :key="label"
              :label="label"
              :icon="shortRestIcon"
              color="neutral"
              variant="subtle"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHORT_REST_LABELS.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleClose"
        />

        <UButton
          :label="SHORT_REST_LABELS.finish"
          :icon="shortRestIcon"
          color="primary"
          @click.left.exact.prevent="handleFinish"
        />
      </div>
    </template>
  </UModal>
</template>
