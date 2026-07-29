<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    getHitDicePools,
    getLongRestHitDiceRecovery,
    getLongRestRecoveryLabels,
    LONG_REST_LABELS,
    LONG_REST_RULES,
    RESOURCE_RECOVERY_ICONS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, completeLongRest } = useCharacterSheet();

  const toast = useToast();

  const longRestIcon = RESOURCE_RECOVERY_ICONS['long-rest'];

  const health = computed(() => character.value.health);

  const hitDicePools = computed(() =>
    getHitDicePools(character.value.hitDice, character.value.extraHitDice),
  );

  /** Возвращаемые кости по номиналам: по правилам — все потраченные. */
  const restoredDice = computed(() =>
    getLongRestHitDiceRecovery(hitDicePools.value),
  );

  const restoredDiceTotal = computed(() =>
    restoredDice.value.reduce((total, pool) => total + pool.count, 0),
  );

  /** Все кости хитов на месте — возвращать нечего. */
  const isDiceFull = computed(
    () => hitDicePools.value.length > 0 && restoredDiceTotal.value === 0,
  );

  /** Примечание под костями: возвращать нечего или вернутся все потраченные. */
  const diceRecoveryNote = computed(() =>
    isDiceFull.value
      ? LONG_REST_LABELS.fullDice
      : LONG_REST_LABELS.diceRecovery,
  );

  const recoveryLabels = computed(() =>
    getLongRestRecoveryLabels(character.value),
  );

  /** Описание тоста об окончании отдыха: что именно вернулось персонажу. */
  const finishDescription = computed(() => {
    const parts = [LONG_REST_LABELS.finishedHitPoints];

    if (restoredDiceTotal.value > 0) {
      parts.push(
        `${LONG_REST_LABELS.finishedDice}: ${restoredDiceTotal.value}.`,
      );
    }

    if (recoveryLabels.value.length > 0) {
      parts.push(
        `${LONG_REST_LABELS.finishedRecovery}: ${recoveryLabels.value.join(', ')}.`,
      );
    }

    return parts.join(' ');
  });

  /**
   * Завершение отдыха: хиты, ячейки и кости хитов восстанавливаются полностью;
   * итог показывается тостом.
   */
  function handleFinish(): void {
    completeLongRest();

    toast.add({
      title: LONG_REST_LABELS.finishedTitle,
      description: finishDescription.value,
      color: 'success',
      icon: longRestIcon,
    });

    emit('close');
  }

  /** Закрытие без отдыха: лист остаётся как был. */
  function handleClose(): void {
    emit('close');
  }
</script>

<template>
  <UModal :title="LONG_REST_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-toned">{{ LONG_REST_LABELS.intro }}</p>

        <UCollapsible class="flex flex-col gap-2">
          <UButton
            :label="LONG_REST_LABELS.rulesTitle"
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
                v-for="rule in LONG_REST_RULES"
                :key="rule"
                class="flex gap-1.5 text-xs leading-relaxed text-toned"
              >
                <UIcon
                  name="tabler:point-filled"
                  class="mt-1 size-3 shrink-0 text-primary"
                />

                <span>{{ rule }}</span>
              </li>
            </ul>
          </template>
        </UCollapsible>

        <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
          <div class="flex items-end justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ LONG_REST_LABELS.hitPointsTitle }}
              </span>

              <span class="flex items-end gap-1.5">
                <span
                  class="text-2xl leading-none font-bold text-highlighted tabular-nums"
                >
                  {{ health.current }}
                </span>

                <span class="text-sm leading-none text-muted">
                  / {{ health.max }}
                </span>

                <span
                  v-if="health.temporary > 0"
                  class="text-sm leading-none font-bold text-primary"
                >
                  +{{ health.temporary }}
                </span>
              </span>
            </div>

            <span
              class="flex items-center gap-1 text-sm font-bold text-success"
            >
              <UIcon
                name="tabler:arrow-up"
                class="size-4"
              />

              {{ health.max }}
            </span>
          </div>

          <span class="border-t border-default/50 pt-2 text-[10px] text-dimmed">
            {{ LONG_REST_LABELS.hitPointsRecovery }}

            <template v-if="health.temporary > 0">
              {{ LONG_REST_LABELS.temporaryNote }}
            </template>
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-baseline justify-between gap-x-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ LONG_REST_LABELS.diceTitle }}
            </span>

            <span class="text-xs text-dimmed">
              {{ LONG_REST_LABELS.diceHint }}
            </span>
          </div>

          <div
            v-if="hitDicePools.length"
            class="flex flex-col gap-1.5 rounded-lg bg-elevated/40 p-3"
          >
            <div
              v-for="pool in hitDicePools"
              :key="pool.die"
              class="flex items-center gap-2"
            >
              <span class="w-9 shrink-0 text-sm font-bold text-highlighted">
                {{ pool.label }}
              </span>

              <span class="text-xs text-muted">
                <span class="font-bold text-highlighted">
                  {{ pool.current }}
                </span>
                / {{ pool.max }}
              </span>

              <span
                class="ml-auto flex items-center gap-1 text-sm font-bold text-success"
              >
                <UIcon
                  name="tabler:arrow-up"
                  class="size-4"
                />

                {{ pool.max }}
              </span>
            </div>

            <span
              class="border-t border-default/50 pt-2 text-[10px] text-dimmed"
            >
              {{ diceRecoveryNote }}
            </span>
          </div>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ LONG_REST_LABELS.noDice }}
          </span>
        </div>

        <div
          v-if="recoveryLabels.length"
          class="flex flex-col gap-2"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ LONG_REST_LABELS.recoveryTitle }}
          </span>

          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="label in recoveryLabels"
              :key="label"
              :label="label"
              :icon="longRestIcon"
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
          :label="LONG_REST_LABELS.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleClose"
        />

        <UButton
          :label="LONG_REST_LABELS.finish"
          :icon="longRestIcon"
          color="primary"
          @click.left.exact.prevent="handleFinish"
        />
      </div>
    </template>
  </UModal>
</template>
