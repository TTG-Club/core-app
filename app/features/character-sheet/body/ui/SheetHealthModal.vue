<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    HIT_DICE_COUNT_MAX,
    HIT_DICE_COUNT_MIN,
    HIT_DIE_OPTIONS,
    HIT_POINTS_MAX,
    HIT_POINTS_MIN,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setHealth, setHitDice } = useCharacterSheet();

  const draftHealth = ref({ ...character.value.health });

  const draftHitDice = ref(
    character.value.hitDice.map((hitDie) => ({ ...hitDie })),
  );

  const draftExtraHitDice = ref(
    character.value.extraHitDice.map((hitDie) => ({ ...hitDie })),
  );

  function handleAddClassDie() {
    draftHitDice.value.push({ die: 6, current: 1, max: 1 });
  }

  function handleRemoveClassDie(dieIndex: number) {
    draftHitDice.value.splice(dieIndex, 1);
  }

  function handleAddExtraDie() {
    draftExtraHitDice.value.push({
      id: crypto.randomUUID(),
      die: 6,
      current: 1,
      max: 1,
    });
  }

  function handleRemoveExtraDie(dieId: string) {
    draftExtraHitDice.value = draftExtraHitDice.value.filter(
      (hitDie) => hitDie.id !== dieId,
    );
  }

  function handleApply() {
    setHealth({ ...draftHealth.value });
    setHitDice(draftHitDice.value, draftExtraHitDice.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Очки здоровья и кости хитов">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-end gap-3">
          <div class="flex grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Сейчас
            </span>

            <UInputNumber
              v-model="draftHealth.current"
              :min="HIT_POINTS_MIN"
              :max="HIT_POINTS_MAX"
            />
          </div>

          <span class="pb-2 text-lg text-dimmed">/</span>

          <div class="flex grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Всего
            </span>

            <UInputNumber
              v-model="draftHealth.max"
              :min="HIT_POINTS_MIN"
              :max="HIT_POINTS_MAX"
            />
          </div>

          <div class="flex grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Врем.
            </span>

            <UInputNumber
              v-model="draftHealth.temporary"
              :min="HIT_POINTS_MIN"
              :max="HIT_POINTS_MAX"
            />
          </div>
        </div>

        <USeparator />

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Кости хитов (из классов)
            </span>

            <UButton
              icon="tabler:plus"
              label="Добавить"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="handleAddClassDie"
            />
          </div>

          <div
            v-if="draftHitDice.length"
            class="grid grid-cols-[1fr_1fr_1.2fr_auto] items-center gap-2"
          >
            <span class="text-[10px] font-bold text-muted uppercase">
              Сейчас
            </span>

            <span class="text-[10px] font-bold text-muted uppercase">
              Всего
            </span>

            <span class="text-[10px] font-bold text-muted uppercase">
              Кость
            </span>

            <span />

            <template
              v-for="(hitDie, dieIndex) in draftHitDice"
              :key="dieIndex"
            >
              <UInputNumber
                v-model="hitDie.current"
                :min="HIT_DICE_COUNT_MIN"
                :max="HIT_DICE_COUNT_MAX"
              />

              <UInputNumber
                v-model="hitDie.max"
                :min="HIT_DICE_COUNT_MIN"
                :max="HIT_DICE_COUNT_MAX"
              />

              <USelect
                v-model="hitDie.die"
                :items="HIT_DIE_OPTIONS"
              />

              <UButton
                icon="tabler:trash"
                color="error"
                variant="ghost"
                size="xs"
                square
                aria-label="Удалить кость хитов"
                @click.left.exact.prevent="handleRemoveClassDie(dieIndex)"
              />
            </template>
          </div>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            Нет костей хитов
          </span>
        </div>

        <USeparator />

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Дополнительные кости хитов
            </span>

            <UButton
              icon="tabler:plus"
              label="Добавить"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="handleAddExtraDie"
            />
          </div>

          <div
            v-if="draftExtraHitDice.length"
            class="grid grid-cols-[1fr_1fr_1.2fr_auto] items-center gap-2"
          >
            <span class="text-[10px] font-bold text-muted uppercase">
              Сейчас
            </span>

            <span class="text-[10px] font-bold text-muted uppercase">
              Всего
            </span>

            <span class="text-[10px] font-bold text-muted uppercase">
              Кость
            </span>

            <span />

            <template
              v-for="hitDie in draftExtraHitDice"
              :key="hitDie.id"
            >
              <UInputNumber
                v-model="hitDie.current"
                :min="HIT_DICE_COUNT_MIN"
                :max="HIT_DICE_COUNT_MAX"
              />

              <UInputNumber
                v-model="hitDie.max"
                :min="HIT_DICE_COUNT_MIN"
                :max="HIT_DICE_COUNT_MAX"
              />

              <USelect
                v-model="hitDie.die"
                :items="HIT_DIE_OPTIONS"
              />

              <UButton
                icon="tabler:trash"
                color="error"
                variant="ghost"
                size="xs"
                square
                aria-label="Удалить кость хитов"
                @click.left.exact.prevent="handleRemoveExtraDie(hitDie.id)"
              />
            </template>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
