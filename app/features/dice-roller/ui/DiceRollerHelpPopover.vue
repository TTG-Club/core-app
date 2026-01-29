<script setup lang="ts">
  import { BASIC_ROLLS, KEEP_ROLLS, REROLL_ROLLS } from '~dice-roller/model';
  import { useDiceRollerState } from '~dice-roller/useDiceRollerState';

  const basic = BASIC_ROLLS;
  const keep = KEEP_ROLLS;
  const reroll = REROLL_ROLLS;
  const { formula } = useDiceRollerState();

  function apply(value: string) {
    formula.value = value;
  }
</script>

<template>
  <UPopover :ui="{ content: 'p-0 overflow-hidden' }">
    <UButton
      icon="i-fluent-info-24-regular"
      variant="ghost"
      color="neutral"
      class="rounded-md text-muted hover:text-default"
      aria-label="Как пользоваться роллером"
    />

    <template #content>
      <div
        class="max-h-[400px] w-[calc(100vw-48px)] space-y-4 overflow-y-auto p-4 pr-3 sm:w-[360px]"
      >
        <!-- Section: Basic -->
        <div class="space-y-2">
          <p class="text-sm font-semibold text-default">Базовые броски</p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="item in basic"
              :key="item.formula"
              color="neutral"
              variant="outline"
              class="flex h-auto cursor-pointer flex-col items-start gap-0.5 rounded-lg border-default bg-elevated p-2 text-left transition hover:border-primary hover:bg-accented"
              @click.left.exact.prevent="apply(item.formula)"
            >
              <span class="text-sm font-bold text-primary">
                {{ item.formula }}
              </span>

              <span class="text-xs text-muted">
                {{ item.note }}
              </span>
            </UButton>
          </div>
        </div>

        <!-- Section: Keep/Drop -->
        <div class="space-y-2">
          <p class="text-sm font-semibold text-default">Лучшие / худшие</p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="item in keep"
              :key="item.formula"
              color="neutral"
              variant="outline"
              class="flex h-auto cursor-pointer flex-col items-start gap-0.5 rounded-lg border-default bg-elevated p-2 text-left transition hover:border-primary hover:bg-accented"
              @click.left.exact.prevent="apply(item.formula)"
            >
              <span class="text-sm font-bold text-primary">
                {{ item.formula }}
              </span>

              <span class="text-xs text-muted"> — {{ item.note }} </span>
            </UButton>
          </div>
        </div>

        <!-- Section: Reroll -->
        <div class="space-y-2">
          <p class="text-sm font-semibold text-default">Перебросы</p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="item in reroll"
              :key="item.formula"
              color="neutral"
              variant="outline"
              class="flex h-auto cursor-pointer flex-col items-start gap-0.5 rounded-lg border-default bg-elevated p-2 text-left transition hover:border-primary hover:bg-accented"
              @click.left.exact.prevent="apply(item.formula)"
            >
              <span class="text-sm font-bold text-primary">
                {{ item.formula }}
              </span>

              <span class="text-xs text-muted"> — {{ item.note }} </span>
            </UButton>
          </div>
        </div>

        <div class="border-t border-default pt-2">
          <p class="text-xs leading-tight text-muted">
            Поддерживаются: к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п, св/су
          </p>
        </div>
      </div>
    </template>
  </UPopover>
</template>
