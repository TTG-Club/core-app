<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useDiceRoller } from '~/composables/useDiceRoller';

  type CriticalType = 'success' | 'failure' | null;

  interface DiceRollItem {
    id: string;
    value: number;
    valid: boolean;
    critical: CriticalType;
  }

  interface DiceDetail {
    id: string;
    label: string;
    total: number;
    rolls: DiceRollItem[];
  }

  interface HistoryEntry {
    id: string;
    formula: string;
    displayValue: string;
    isError: boolean;
    timestamp: string;
    detail?: string;
  }

  const rollFormula = ref<string>('');
  const result = ref<string | number | null>('');
  const history = ref<HistoryEntry[]>([]);
  const isCollapsed = ref<boolean>(true);
  const lastRollDetails = ref<DiceDetail[]>([]);

  const hasResult = computed(() => {
    return (
      result.value !== '' && result.value !== undefined && result.value !== null
    );
  });

  const isErrorResult = computed(() => {
    return (
      typeof result.value === 'string' && result.value.startsWith('Ошибка:')
    );
  });

  const resultDescription = computed(() => {
    if (!hasResult.value) {
      return '';
    }

    if (isErrorResult.value && typeof result.value === 'string') {
      return result.value.replace(/^Ошибка:\s*/i, '');
    }

    if (typeof result.value === 'number') {
      return result.value.toLocaleString('ru-RU');
    }

    return String(result.value);
  });

  const hasHistory = computed(() => history.value.length > 0);

  const diceDetails = computed(() => lastRollDetails.value);

  const hasDiceDetails = computed(
    () =>
      Array.isArray(lastRollDetails.value) && lastRollDetails.value.length > 0,
  );

  const addHistoryEntry = (payload: {
    formula: string;
    value: string | number;
    isError: boolean;
    detail?: string;
  }) => {
    const { formula, value, isError, detail } = payload;

    if (!formula) {
      return;
    }

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      formula,
      displayValue:
        typeof value === 'number'
          ? value.toLocaleString('ru-RU')
          : String(value),
      isError,
      timestamp: new Date().toISOString(),
      detail: detail || undefined,
    };

    history.value = [entry, ...history.value].slice(0, 8);
  };

  const formatHistoryTimestamp = (entry: HistoryEntry) => {
    if (!entry?.timestamp) {
      return '';
    }

    return new Date(entry.timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearHistory = () => {
    history.value = [];
  };

  const toggleCollapse = (force?: boolean) => {
    if (typeof force === 'boolean') {
      isCollapsed.value = force;

      return;
    }

    isCollapsed.value = !isCollapsed.value;
  };

  const describeDie = (roll: any, index: number): string => {
    const countValue = roll?.count?.value;
    const die = roll?.die;
    const dieType = die?.type;

    let suffix = '?';

    if (dieType === 'fate') {
      suffix = 'кс';
    } else if (dieType === 'number') {
      const dieValue = die?.value;

      if (dieValue === 100) {
        suffix = 'к%';
      } else if (typeof dieValue === 'number') {
        suffix = `к${dieValue}`;
      }
    }

    if (suffix === '?' && roll?.label) {
      return roll.label;
    }

    if (typeof countValue === 'number') {
      return `${countValue}${suffix}`;
    }

    return `Бросок ${index + 1}`;
  };

  const extractRollDetails = (roll: any): DiceDetail[] => {
    const details: DiceDetail[] = [];

    const traverse = (node: any, index: string | number = 0) => {
      if (!node || typeof node !== 'object') {
        return;
      }

      if (node.type === 'die' && Array.isArray(node.rolls)) {
        details.push({
          id: `${index}-${node.order}`,
          label: describeDie(node, details.length),
          total: node.value,
          rolls: node.rolls.map(
            (item: any, rollIndex: number): DiceRollItem => ({
              id: `${index}-${rollIndex}`,
              value: item.value,
              valid: item.valid,
              critical: (item.critical as CriticalType | undefined) ?? null,
            }),
          ),
        });

        return;
      }

      if (Array.isArray(node.dice)) {
        node.dice.forEach((child: any, childIndex: number) =>
          traverse(child, `${index}-${childIndex}`),
        );
      }

      if (node.expr) {
        traverse(node.expr, `${index}-expr`);
      }
    };

    traverse(roll);

    return details;
  };

  const formatDetailSummary = (details: DiceDetail[]): string => {
    if (!Array.isArray(details) || !details.length) {
      return '';
    }

    const chunks = details.map((detail) => {
      const rolls = detail.rolls
        .filter((item) => item.valid)
        .map((item) => item.value)
        .join(' + ');

      if (!rolls) {
        return '';
      }

      return `${detail.label}: ${rolls}`;
    });

    return chunks.filter(Boolean).join(' | ');
  };

  const formatDetailTotal = (value: number | null | undefined): string => {
    return typeof value === 'number'
      ? value.toLocaleString('ru-RU')
      : String(value ?? '');
  };

  const rollDice = () => {
    try {
      const formula = (rollFormula.value || '').trim();

      if (!formula) {
        throw new Error('Введите роллформулу');
      }

      const diceRoller = useDiceRoller();
      const { valid, error } = diceRoller.validateWithError(formula);

      if (!valid) {
        throw new Error(error);
      }

      const rollObject: any = diceRoller.roll(formula);
      const value: number = rollObject.value;

      result.value = value;
      lastRollDetails.value = extractRollDetails(rollObject);

      addHistoryEntry({
        formula,
        value,
        isError: false,
        detail: formatDetailSummary(lastRollDetails.value),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';

      result.value = `Ошибка: ${message}`;
      lastRollDetails.value = [];

      addHistoryEntry({
        formula: (rollFormula.value || '').trim(),
        value: message,
        isError: true,
        detail: undefined,
      });
    }
  };
</script>

<template>
  <Teleport to="body">
    <div
      class="dice-roller"
      role="region"
      aria-live="polite"
    >
      <Transition
        name="dice-roller-collapse"
        mode="out-in"
      >
        <section
          v-if="!isCollapsed"
          key="expanded"
          class="dice-roller-card"
          aria-labelledby="dice-roller-title"
        >
          <header class="dice-roller-card__header">
            <div class="dice-roller-card__intro">
              <p class="dice-roller-card__eyebrow">Всегда под рукой</p>

              <h2
                id="dice-roller-title"
                class="dice-roller-card__title"
              >
                Роллер кубов
              </h2>

              <p class="dice-roller-card__description">
                Поддерживает нотацию Roll20 и русские операторы — бросайте кубы,
                не покидая страницу.
              </p>
            </div>

            <div class="dice-roller-card__meta">
              <UBadge
                size="sm"
                variant="subtle"
                color="primary"
              >
                beta
              </UBadge>

              <UButton
                icon="i-fluent-dock-right-16-regular"
                variant="ghost"
                color="neutral"
                size="sm"
                aria-label="Свернуть роллер"
                @click.left.exact.prevent="toggleCollapse(true)"
              />
            </div>
          </header>

          <form
            class="dice-roller-card__form"
            @submit.prevent="rollDice"
          >
            <div class="dice-roller-card__label-row">
              <label
                class="dice-roller-card__label"
                for="dice-roll-formula"
              >
                Роллформула
              </label>

              <div class="dice-roller-card__info">
                <button
                  type="button"
                  class="dice-roller-card__info-button"
                  aria-label="Как пользоваться роллером"
                >
                  <UIcon name="i-fluent-info-16-regular" />

                  <div class="dice-roller-card__info-panel">
                    <p><strong>Базовые броски</strong></p>

                    <ul>
                      <li>к20 — одиночный куб</li>

                      <li>2к6+3 — сумма с модификатором</li>

                      <li>(4к6вх3+2)*2 — группировка</li>
                    </ul>

                    <p><strong>Лучшие / худшие</strong></p>

                    <ul>
                      <li>4к6вх3 — оставить лучшие (kh3)</li>

                      <li>3к8вл1 — оставить худшие (kl1)</li>

                      <li>5к10ул2 — убрать лучшие (dh2)</li>

                      <li>5к10ух2 — убрать худшие (dl2)</li>
                    </ul>

                    <p><strong>Перебросы</strong></p>

                    <ul>
                      <li>к20пр1 — переброс значения 1 один раз (ro1)</li>

                      <li>10к6пб2 — перебрасывать 2 до нового значения (r2)</li>

                      <li>8к6р&lt;3 — переброс всех &lt;3 (r&lt;3)</li>
                    </ul>

                    <p><strong>Взрывающиеся</strong></p>

                    <ul>
                      <li>6к6! — взрыв максимума (!)</li>

                      <li>8к6!&gt;=5 — взрыв ≥5</li>

                      <li>4к6!! — бесконечный взрыв (!!)</li>

                      <li>5к6!п — проникающий взрыв (!p)</li>
                    </ul>

                    <p><strong>Успехи / провалы</strong></p>

                    <ul>
                      <li>10к6&gt;=5 — счёт успехов</li>

                      <li>10к6&gt;=5п1 — успехи с провалами (f1)</li>

                      <li>8к6с6 — подсчёт совпадений (m6)</li>
                    </ul>

                    <p><strong>Спец-кости</strong></p>

                    <ul>
                      <li>4кс — FATE (−1/0/+1)</li>

                      <li>к% — процентная (d100)</li>
                    </ul>

                    <p><strong>Комбинации</strong></p>

                    <ul>
                      <li>2к20вх1+5 — кастомный advantage</li>

                      <li>
                        floor((4к6вх3+2)/2) — функции floor/ceil/round/min/max
                      </li>

                      <li>10к6!&gt;=5 — пул + взрывы + успехи</li>

                      <li>6*(4к6вх3) — генератор характеристик</li>
                    </ul>

                    <p><strong>Поддерживаются русские операторы</strong></p>

                    <p>к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п, св/су</p>
                  </div>
                </button>
              </div>
            </div>

            <UInput
              id="dice-roll-formula"
              v-model="rollFormula"
              placeholder="Например: 4к6вх3+2"
              size="xl"
              class="dice-roller-card__input"
            />

            <UButton
              type="submit"
              size="xl"
              color="primary"
              block
            >
              Бросить кубы
            </UButton>
          </form>

          <div class="dice-roller-card__result">
            <Transition
              name="dice-roller-fade"
              mode="out-in"
            >
              <UAlert
                v-if="hasResult"
                :key="isErrorResult ? 'error' : 'result'"
                :color="isErrorResult ? 'error' : 'success'"
                variant="soft"
              >
                <template #title>
                  {{ isErrorResult ? 'Ошибка' : 'Результат' }}
                </template>

                <template #description>
                  {{ resultDescription }}
                </template>
              </UAlert>

              <div
                v-else
                key="placeholder"
                class="dice-roller-card__placeholder"
              >
                <p>Введите формулу и нажмите «Бросить» или клавишу Enter.</p>
              </div>
            </Transition>

            <div
              v-if="hasDiceDetails"
              class="dice-roller-card__dice-details"
            >
              <div
                v-for="detail in diceDetails"
                :key="detail.id"
                class="dice-roller-card__dice-group"
              >
                <div class="dice-roller-card__dice-header">
                  <span>{{ detail.label }}</span>

                  <span class="dice-roller-card__dice-total">
                    {{ formatDetailTotal(detail.total) }}
                  </span>
                </div>

                <ul class="dice-roller-card__dice-rolls">
                  <li
                    v-for="roll in detail.rolls"
                    :key="roll.id"
                    :class="[
                      'dice-roller-card__dice-roll',
                      roll.valid ? 'is-valid' : 'is-dropped',
                    ]"
                  >
                    <span>{{ roll.value }}</span>

                    <UBadge
                      v-if="
                        roll.critical === 'success' ||
                        roll.critical === 'failure'
                      "
                      :color="roll.critical === 'success' ? 'success' : 'error'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ roll.critical === 'success' ? 'крит' : 'фейл' }}
                    </UBadge>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            v-if="hasHistory"
            class="dice-roller-card__history"
          >
            <div class="dice-roller-card__history-header">
              <div>
                <p>История бросков</p>

                <span>последние {{ history.length }}</span>
              </div>

              <UButton
                icon="i-fluent-delete-16-regular"
                variant="ghost"
                color="neutral"
                size="xs"
                label="Очистить"
                @click.left.exact.prevent="clearHistory"
              />
            </div>

            <TransitionGroup
              name="dice-roller-history"
              tag="ul"
              class="dice-roller-card__history-list"
            >
              <li
                v-for="entry in history"
                :key="entry.id"
                class="dice-roller-card__history-item"
                :class="[
                  entry.isError
                    ? 'dice-roller-card__history-item--error'
                    : 'dice-roller-card__history-item--success',
                ]"
              >
                <div class="dice-roller-card__history-meta">
                  <p>{{ entry.formula }}</p>

                  <span>{{ formatHistoryTimestamp(entry) }}</span>

                  <p
                    v-if="entry.detail"
                    class="dice-roller-card__history-detail"
                  >
                    {{ entry.detail }}
                  </p>
                </div>

                <span class="dice-roller-card__history-value">
                  {{ entry.displayValue }}
                </span>
              </li>
            </TransitionGroup>
          </div>
        </section>

        <button
          v-else
          key="collapsed"
          class="dice-roller__toggle"
          type="button"
          aria-label="Открыть роллер кубов"
          @click.left.exact.prevent="toggleCollapse(false)"
        >
          <span
            class="dice-roller__toggle-icon"
            aria-hidden="true"
          >
            <UIcon name="i-fluent-dice-5-regular" />
          </span>

          <div class="dice-roller__toggle-text">
            <strong>Роллер кубов</strong>

            <span>Нажмите, чтобы открыть</span>
          </div>
        </button>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
  .dice-roller {
    pointer-events: none;

    position: fixed;
    z-index: 120;
    right: calc(16px + var(--safe-area-inset-right, 0px));
    bottom: calc(16px + var(--safe-area-inset-bottom, 0px));

    width: min(364px, calc(100vw - 32px));
  }

  @media (min-width: 768px) {
    .dice-roller {
      width: 380px;
    }
  }

  .dice-roller-card,
  .dice-roller__toggle {
    pointer-events: auto;
  }

  .dice-roller-card {
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 24px;

    width: 100%;
    padding: 24px;
    border: 1px solid var(--ui-border);
    border-radius: 24px;

    background: linear-gradient(
      160deg,
      var(--ui-bg-elevated) 0%,
      var(--ui-bg) 55%,
      var(--ui-bg-accented) 100%
    );
    backdrop-filter: blur(14px);
    box-shadow: 0 25px 60px rgba(8, 15, 17, 0.25);
  }

  .dice-roller-card::after {
    pointer-events: none;
    content: '';

    position: absolute;
    inset: 1px;

    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 22px;
  }

  .dice-roller-card__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .dice-roller-card__meta {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .dice-roller-card__intro {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dice-roller-card__eyebrow {
    font-size: 12px;
    color: var(--ui-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .dice-roller-card__title {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
    color: var(--ui-text-highlighted);
  }

  .dice-roller-card__description {
    margin: 4px 0 0;
    line-height: 1.4;
    color: var(--ui-text-muted);
  }

  .dice-roller-card__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dice-roller-card__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--ui-text);
    letter-spacing: 0.02em;
  }

  .dice-roller-card__hint {
    display: flex;
    flex-direction: column;
    gap: 8px;

    font-size: 13px;
    color: var(--ui-text-muted);
  }

  .dice-roller-card__hint ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    margin: 0;
    padding: 0;

    list-style: none;
  }

  .dice-roller-card__hint li {
    padding: 2px 8px;
    border: 1px dashed var(--ui-border);
    border-radius: 999px;

    font-family:
      'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace;
    font-weight: 600;

    background: rgba(0, 0, 0, 0.04);
  }

  :global(html.dark) .dice-roller-card__hint li {
    background: rgba(255, 255, 255, 0.06);
  }

  .dice-roller-card__result {
    min-height: 128px;
  }

  .dice-roller-card__placeholder {
    display: flex;
    align-items: center;

    min-height: 112px;
    padding: 16px;
    border: 1px dashed var(--ui-border);
    border-radius: 20px;

    color: var(--ui-text-muted);

    background: linear-gradient(
      135deg,
      var(--ui-bg) 0%,
      var(--ui-bg-elevated) 100%
    );
  }

  .dice-roller-card__placeholder p {
    margin: 0;
    line-height: 1.4;
  }

  .dice-roller-card__dice-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
  }

  .dice-roller-card__dice-group {
    padding: 12px 14px;
    border: 1px solid var(--ui-border);
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.04);
  }

  :global(html.dark) .dice-roller-card__dice-group {
    background: rgba(255, 255, 255, 0.04);
  }

  .dice-roller-card__dice-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 8px;

    font-weight: 600;
    color: var(--ui-text);
  }

  .dice-roller-card__dice-total {
    color: var(--ui-text-highlighted);
  }

  .dice-roller-card__dice-rolls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    margin: 0;
    padding: 0;

    list-style: none;
  }

  .dice-roller-card__dice-roll {
    display: inline-flex;
    gap: 6px;
    align-items: center;

    padding: 4px 10px;
    border: 1px solid transparent;
    border-radius: 999px;

    font-weight: 600;

    background: var(--ui-bg-elevated);
  }

  .dice-roller-card__dice-roll.is-dropped {
    border-color: var(--ui-border);
    text-decoration: line-through;
    opacity: 0.6;
  }

  .dice-roller-card__dice-roll.is-valid {
    border-color: color-mix(
      in srgb,
      var(--ui-color-primary-500) 40%,
      transparent
    );
  }

  .dice-roller-card__history {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;

    max-height: 220px;
  }

  .dice-roller-card__history-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .dice-roller-card__history-header p {
    margin: 0;
    font-weight: 600;
    color: var(--ui-text);
  }

  .dice-roller-card__history-header span {
    display: block;
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .dice-roller-card__history-list {
    scrollbar-gutter: stable;

    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;

    max-height: 168px;
    margin: 0;
    padding: 0;
    padding-right: 4px;

    list-style: none;
  }

  .dice-roller-card__history-item {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;

    padding: 12px 14px;
    border: 1px solid var(--ui-border);
    border-radius: 16px;

    background: color-mix(in srgb, var(--ui-bg) 85%, transparent);
  }

  .dice-roller-card__history-item--success {
    border-color: color-mix(
      in srgb,
      var(--ui-color-success-500) 25%,
      transparent
    );
  }

  .dice-roller-card__history-item--error {
    border-color: color-mix(
      in srgb,
      var(--ui-color-error-500) 25%,
      transparent
    );
  }

  .dice-roller-card__history-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .dice-roller-card__history-meta p {
    margin: 0;
    font-weight: 600;
    color: var(--ui-text-highlighted);
  }

  .dice-roller-card__history-meta span {
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .dice-roller-card__history-detail {
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .dice-roller-card__history-value {
    font-family:
      'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace;
    font-weight: 600;
    color: var(--ui-text-highlighted);
    white-space: nowrap;
  }

  .dice-roller__toggle {
    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    padding: 14px 18px;
    border: 1px solid var(--ui-border);
    border-radius: 16px;

    font-size: 14px;
    color: var(--ui-text);

    background: var(--ui-bg-elevated);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);

    transition:
      transform 200ms ease,
      box-shadow 200ms ease;
  }

  .dice-roller__toggle:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.3);
  }

  .dice-roller__toggle-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    border-radius: 12px;

    font-size: 22px;
    color: var(--color-primary-500);

    background: var(--ui-bg-accented);
  }

  .dice-roller__toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
  }

  .dice-roller__toggle-text strong {
    font-size: 15px;
    color: var(--ui-text-highlighted);
  }

  .dice-roller__toggle-text span {
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .dice-roller-fade-enter-active,
  .dice-roller-fade-leave-active {
    transition:
      opacity 200ms ease,
      transform 200ms ease;
  }

  .dice-roller-fade-enter-from,
  .dice-roller-fade-leave-to {
    transform: translateY(8px);
    opacity: 0;
  }

  .dice-roller-collapse-enter-active,
  .dice-roller-collapse-leave-active {
    transition:
      opacity 220ms ease,
      transform 220ms ease;
  }

  .dice-roller-collapse-enter-from,
  .dice-roller-collapse-leave-to {
    transform: translateY(8px);
    opacity: 0;
  }

  .dice-roller-history-enter-active,
  .dice-roller-history-leave-active {
    transition: all 200ms ease;
  }

  .dice-roller-history-enter-from,
  .dice-roller-history-leave-to {
    transform: translateY(6px);
    opacity: 0;
  }

  .dice-roller-card__label-row {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .dice-roller-card__label-row {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .dice-roller-card__info {
    position: relative;
  }

  .dice-roller-card__info-button {
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--ui-border);
    border-radius: 999px;

    color: var(--ui-text-muted);

    background: var(--ui-bg-elevated);
  }

  .dice-roller-card__info-button:hover,
  .dice-roller-card__info-button:focus-visible {
    border-color: var(--ui-color-primary-500);
    color: var(--ui-text-highlighted);
  }

  .dice-roller-card__info-panel {
    scrollbar-gutter: stable;

    position: absolute;
    z-index: 10;
    top: 32px;
    right: 0;
    transform: translateY(4px);

    /* чтобы большой текст влезал красиво */
    overflow-y: auto;

    min-width: 320px;
    max-width: 420px;
    max-height: 320px;
    padding: 14px 16px;
    border: 1px solid var(--ui-border);
    border-radius: 12px;

    font-size: 13px;
    color: var(--ui-text);
    text-align: left;

    visibility: hidden;
    opacity: 0;
    background: var(--ui-bg-elevated);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);

    transition:
      opacity 150ms ease,
      transform 150ms ease,
      visibility 150ms ease;
  }

  .dice-roller-card__info-button:hover .dice-roller-card__info-panel,
  .dice-roller-card__info-button:focus-visible .dice-roller-card__info-panel {
    transform: translateY(0);
    visibility: visible;
    opacity: 1;
  }

  .dice-roller-card__info-panel ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    margin: 8px 0 0;
    padding: 0;

    list-style: none;
  }

  .dice-roller-card__info-panel li {
    padding: 2px 8px;
    border: 1px dashed var(--ui-border);
    border-radius: 999px;

    font-family:
      'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace;
    font-weight: 600;

    background: rgba(0, 0, 0, 0.04);
  }

  :global(html.dark) .dice-roller-card__info-panel li {
    background: rgba(255, 255, 255, 0.06);
  }
</style>
