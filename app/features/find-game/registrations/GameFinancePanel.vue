<script setup lang="ts">
  import type { Game, GameFinanceAccount } from '../model';

  import { UiResult } from '~ui/result';

  import { useParticipantNames } from '../composables';
  import {
    confirmSessionPayment,
    fetchGameFinance,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_FINANCE_AMOUNT,
    GAME_FINANCE_BALANCE,
    GAME_FINANCE_CONFIRM,
    GAME_FINANCE_DEBT,
    GAME_FINANCE_EMPTY,
    GAME_FINANCE_PENDING,
    GAME_FINANCE_TITLE,
    GAME_FINANCE_TOP_UP,
    getFindGameErrorMessage,
    SESSION_CURRENCY_OPTIONS,
    SESSION_CURRENCY_PLACEHOLDER,
    SESSION_DEFAULT_CURRENCY,
    topUpGameAccount,
  } from '../model';

  /** Валюта депозита по умолчанию: та, в которой у игрока уже есть долг. */
  function getDefaultDepositCurrency(account: GameFinanceAccount): string {
    const debt = account.bills.find((bill) => bill.remaining > 0);

    return (
      debt?.currency
      ?? Object.keys(account.balances)[0]
      ?? SESSION_DEFAULT_CURRENCY
    );
  }

  const { game } = defineProps<{ game: Game }>();
  const toast = useToast();
  const { getParticipantName, resolveNames } = useParticipantNames();
  const depositAmounts = ref<Record<string, number>>({});
  const depositCurrencies = ref<Record<string, string>>({});
  const isSaving = ref(false);

  const {
    data: finance,
    refresh,
    status,
  } = useAsyncData(
    () => `find-game-finance-${game.id}`,
    () => fetchGameFinance(game.id),
    { server: false, default: () => ({ accounts: [] }) },
  );

  watch(
    finance,
    (value) => {
      void resolveNames(value.accounts.map((account) => account.playerId));

      // Обновление списка не сбрасывает выбор мастера: валюту подставляем
      // только тем счетам, где он её ещё не выбирал.
      depositCurrencies.value = Object.fromEntries(
        value.accounts.map((account) => [
          account.playerId,
          depositCurrencies.value[account.playerId]
            ?? getDefaultDepositCurrency(account),
        ]),
      );
    },
    { immediate: true },
  );

  /** Форматирует отдельную валюту без смешивания балансов. */
  function formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /** Добавляет депозит указанному игроку и обновляет историю. */
  async function addDeposit(account: GameFinanceAccount): Promise<void> {
    const { playerId } = account;
    const amount = depositAmounts.value[playerId] ?? 0;

    const currency =
      depositCurrencies.value[playerId] ?? getDefaultDepositCurrency(account);

    if (amount <= 0) {
      return;
    }

    isSaving.value = true;

    try {
      await topUpGameAccount(game.id, playerId, amount, currency);

      depositAmounts.value = { ...depositAmounts.value, [playerId]: 0 };
      await refresh();
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }

  /** Подтверждает заявленную игроком внешнюю оплату. */
  async function confirmPayment(
    sessionId: string,
    playerId: string,
  ): Promise<void> {
    isSaving.value = true;

    try {
      await confirmSessionPayment(game.id, sessionId, playerId, true);
      await refresh();
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <section class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold text-highlighted">
        {{ GAME_FINANCE_TITLE }}
      </h2>

      <p class="text-sm text-muted">
        Учёт авансов и долгов ведётся внутри игры; реальные платежи сервис не
        обрабатывает.
      </p>
    </div>

    <USkeleton
      v-if="status === 'pending'"
      class="h-28 w-full rounded-md"
    />

    <UiResult
      v-else-if="finance.accounts.length === 0"
      status="info"
      :title="GAME_FINANCE_EMPTY"
    />

    <div
      v-else
      class="grid gap-3 lg:grid-cols-2"
    >
      <UCard
        v-for="account in finance.accounts"
        :key="account.playerId"
        :ui="{ body: 'p-4' }"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <span class="font-medium text-highlighted">{{
              getParticipantName(account.playerId)
            }}</span>

            <div class="flex flex-wrap justify-end gap-1">
              <UBadge
                v-for="(balance, currency) in account.balances"
                :key="currency"
                color="neutral"
                variant="subtle"
                :label="`${GAME_FINANCE_BALANCE}: ${formatMoney(balance, currency)}`"
              />
            </div>
          </div>

          <div
            v-if="account.bills.some((bill) => bill.remaining > 0)"
            class="flex flex-col gap-1 text-sm"
          >
            <span
              v-for="bill in account.bills.filter((bill) => bill.remaining > 0)"
              :key="bill.sessionId"
              class="text-error"
            >
              {{ GAME_FINANCE_DEBT }}: {{ bill.title }} —
              {{ formatMoney(bill.remaining, bill.currency) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <UInput
              v-model.number="depositAmounts[account.playerId]"
              type="number"
              min="0"
              step="0.01"
              :placeholder="GAME_FINANCE_AMOUNT"
              class="min-w-0 flex-1"
            />

            <USelectMenu
              v-model="depositCurrencies[account.playerId]"
              value-key="value"
              :items="SESSION_CURRENCY_OPTIONS"
              :placeholder="SESSION_CURRENCY_PLACEHOLDER"
              class="w-40"
            />

            <UButton
              color="primary"
              variant="subtle"
              icon="tabler:plus"
              :loading="isSaving"
              :label="GAME_FINANCE_TOP_UP"
              @click.left.exact.prevent="addDeposit(account)"
            />
          </div>

          <div
            v-if="account.bills.some((bill) => bill.claimed > 0)"
            class="flex flex-col gap-2 border-t border-default pt-3"
          >
            <div
              v-for="bill in account.bills.filter((bill) => bill.claimed > 0)"
              :key="bill.sessionId"
              class="flex items-center justify-between gap-2 text-sm"
            >
              <span>{{ bill.title }} · {{ GAME_FINANCE_PENDING }}</span>

              <UButton
                size="xs"
                color="success"
                variant="subtle"
                icon="tabler:check"
                :loading="isSaving"
                :label="GAME_FINANCE_CONFIRM"
                @click.left.exact.prevent="
                  confirmPayment(bill.sessionId, account.playerId)
                "
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </section>
</template>
