import type {
  AnalysisResult,
  CheckKind,
  FormulaNode,
  RollMode,
  RollModifiers,
  RollResult,
} from '../model';

import {
  analyzeFormula,
  appendDie,
  applyRollMode,
  changeModifier,
  createRollLabel,
  DICE_FORMULA_STORAGE_KEY,
  dropLastTerm,
  findCheckKind,
  forceCriticalDamage,
  halveDamage,
  parseFormula,
  rollFormula,
} from '../model';

/** Задержка перед пересчётом анализа, пока пользователь правит формулу. */
const ANALYSIS_REFRESH_DELAY = 400;

/** Разобранная формула вместе с переключателями, которые на неё повлияли. */
interface PreparedFormula {
  source: string;
  node: FormulaNode;
  modifiers: RollModifiers;
}

/** Анализ формулы вместе с ключом, по которому его можно переиспользовать. */
interface FormulaAnalysis {
  key: string;
  label: string;
  checkKind: CheckKind | null;
  result: AnalysisResult;
}

/**
 * Состояние калькулятора бросков: формула, режим, последний бросок
 * и анализ вероятностей.
 *
 * Состояние общее на всю страницу, поэтому карточкам не нужно прокидывать
 * друг другу пропсы; вместе с последней карточкой оно исчезает.
 */
export const useDiceCalculator = createSharedComposable(() => {
  const formula = useLocalStorage(DICE_FORMULA_STORAGE_KEY, '');
  const errorMessage = ref('');
  const rollMode = ref<RollMode | null>(null);
  const isCriticalDamage = ref(false);
  const hasResistance = ref(false);
  const result = shallowRef<RollResult | null>(null);
  const isAnalysisOpen = ref(false);
  const analysis = shallowRef<FormulaAnalysis | null>(null);
  const chanceThreshold = ref<number | null>(null);

  const hasError = computed(() => Boolean(errorMessage.value));

  /**
   * Разобранная формула из поля ввода. Разбор молчаливый: пока формулу
   * дописывают, она то и дело невалидна, и ругаться на это рано —
   * сообщение об ошибке появится при броске.
   */
  const parsedFormula = computed<FormulaNode | null>(() => {
    const trimmed = formula.value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      return parseFormula(trimmed);
    } catch {
      return null;
    }
  });

  /** Формулу можно бросить и преобразовать кнопками. */
  const isFormulaValid = computed(() => parsedFormula.value !== null);

  /**
   * Преимущество и помеха меняют только одиночную d20, поэтому кнопки режимов
   * показываются лишь тогда, когда им есть что менять. Недописанная формула
   * режимов не предлагает — они появятся, как только d20 будет набрана.
   */
  const isRollModeAvailable = computed(
    () =>
      parsedFormula.value !== null
      && applyRollMode(parsedFormula.value, 'advantage').changed,
  );

  /**
   * Разбирает текущую формулу и применяет к ней режим броска.
   *
   * @param source - Формула для разбора
   * @returns Разобранная формула либо null, если разбор не удался
   */
  function prepare(source: string): PreparedFormula | null {
    const trimmed = source.trim();

    if (!trimmed) {
      errorMessage.value = 'Введите формулу или нажмите на кость';

      return null;
    }

    try {
      const parsed = parseFormula(trimmed);
      const { node, changed } = applyRollMode(parsed, rollMode.value);

      errorMessage.value = '';

      // Крит считается первым, и только потом сопротивление делит итог
      // пополам — порядок тот же, что и за столом.
      let prepared = isCriticalDamage.value ? forceCriticalDamage(node) : node;

      if (hasResistance.value) {
        prepared = halveDamage(prepared);
      }

      return {
        source: trimmed,
        node: prepared,
        modifiers: {
          // Без одиночной d20 режим ни на что не влияет, и подписывать бросок
          // преимуществом было бы враньём.
          mode: changed ? rollMode.value : null,
          critical: isCriticalDamage.value,
          resistance: hasResistance.value,
        },
      };
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Не удалось разобрать формулу';

      return null;
    }
  }

  /**
   * Пересчитывает анализ, если формула или режим изменились с прошлого раза.
   *
   * @param prepared - Разобранная формула
   */
  function updateAnalysis(prepared: PreparedFormula): void {
    const { mode, critical, resistance } = prepared.modifiers;
    const key = `${prepared.source}|${mode ?? ''}|${critical}|${resistance}`;

    if (analysis.value?.key === key) {
      return;
    }

    const analysisResult = analyzeFormula(prepared.node);

    analysis.value = {
      key,
      label: createRollLabel(prepared.source, prepared.modifiers),
      checkKind: findCheckKind(prepared.node),
      result: analysisResult,
    };

    chanceThreshold.value = Math.ceil(analysisResult.mean);
  }

  /**
   * Бросает разобранную формулу и обновляет результат вместе с анализом.
   *
   * @param prepared - Разобранная формула
   */
  function execute(prepared: PreparedFormula): void {
    const { value, parts } = rollFormula(prepared.node);

    result.value = {
      label: createRollLabel(prepared.source, prepared.modifiers),
      value,
      parts,
    };

    if (isAnalysisOpen.value) {
      updateAnalysis(prepared);
    }
  }

  /** Бросает формулу из поля ввода. */
  function roll(): void {
    const prepared = prepare(formula.value);

    if (prepared) {
      execute(prepared);
    }
  }

  /**
   * Подставляет формулу в поле ввода, не бросая её.
   *
   * @param source - Формула для подстановки
   */
  function setFormula(source: string): void {
    formula.value = source;
    errorMessage.value = '';
  }

  /**
   * Подставляет формулу в поле ввода и сразу бросает её.
   *
   * @param source - Формула для броска
   */
  function setAndRoll(source: string): void {
    setFormula(source);
    roll();
  }

  /**
   * Включает или выключает режим броска. Повторное нажатие снимает режим.
   *
   * @param mode - Режим, по которому нажали
   */
  function toggleMode(mode: RollMode): void {
    rollMode.value = rollMode.value === mode ? null : mode;
  }

  /** Открывает или закрывает карточку анализа. */
  function toggleAnalysis(): void {
    if (isAnalysisOpen.value) {
      isAnalysisOpen.value = false;

      return;
    }

    const prepared = prepare(formula.value);

    if (!prepared) {
      return;
    }

    isAnalysisOpen.value = true;
    updateAnalysis(prepared);
  }

  /**
   * Добавляет кость в формулу кнопкой быстрого набора.
   *
   * @param sides - Число граней кости
   */
  function addDie(sides: number): void {
    setFormula(appendDie(formula.value, sides));
  }

  /**
   * Меняет модификатор в конце формулы.
   *
   * @param delta - На сколько изменить модификатор
   */
  function adjustModifier(delta: number): void {
    setFormula(changeModifier(formula.value, delta));
  }

  /** Включает или выключает удвоение костей урона. */
  function toggleCriticalDamage(): void {
    isCriticalDamage.value = !isCriticalDamage.value;
  }

  /** Включает или выключает половину урона. */
  function toggleResistance(): void {
    hasResistance.value = !hasResistance.value;
  }

  /** Убирает из формулы последний элемент. */
  function dropLast(): void {
    setFormula(dropLastTerm(formula.value));
  }

  /** Очищает поле формулы. */
  function reset(): void {
    setFormula('');
  }

  // Пока карточка анализа открыта, он следует за формулой и переключателями.
  // Обратной связи нет — анализ ничего из них не меняет, поэтому цикла не возникает.
  watchDebounced(
    [formula, rollMode, isCriticalDamage, hasResistance],
    () => {
      if (!isAnalysisOpen.value) {
        return;
      }

      const prepared = prepare(formula.value);

      if (prepared) {
        updateAnalysis(prepared);
      }
    },
    { debounce: ANALYSIS_REFRESH_DELAY },
  );

  return {
    formula,
    errorMessage,
    hasError,
    rollMode,
    isCriticalDamage,
    hasResistance,
    isFormulaValid,
    isRollModeAvailable,
    result,
    isAnalysisOpen,
    analysis,
    chanceThreshold,

    roll,
    setFormula,
    setAndRoll,
    toggleMode,
    toggleAnalysis,
    addDie,
    adjustModifier,
    toggleCriticalDamage,
    toggleResistance,
    dropLast,
    reset,
  };
});
