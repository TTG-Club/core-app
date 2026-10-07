import type {
  CheckFormulaNode,
  DiceFormulaNode,
  FormulaKeywordToken,
  FormulaNode,
  FormulaToken,
  OnHitFormulaNode,
} from './types';

import {
  DICE_MAX_COUNT,
  DICE_MAX_SIDES,
  DICE_MIN_COUNT,
  DICE_MIN_SIDES,
} from './constants';
import { tokenizeFormula } from './tokenizer';

/**
 * Рекурсивный нисходящий разбор токенов формулы.
 *
 * Грамматика, сверху вниз:
 * - `expression` — сумма, к которой может быть приписана проверка «СЛ 15» или «КД 15»;
 * - `additive` — цепочка сложений и вычитаний;
 * - `term` — цепочка умножений; после проверки умножение читается как урон при попадании;
 * - `atom` — число, кость, скобки или унарный минус.
 */
class FormulaParser {
  private position = 0;

  constructor(private readonly tokens: FormulaToken[]) {}

  /**
   * Разбирает все токены и убеждается, что в конце ничего не осталось.
   *
   * @returns Корневой узел формулы
   */
  parse(): FormulaNode {
    const node = this.expression();

    if (this.position < this.tokens.length) {
      throw new Error('Лишние символы в конце формулы');
    }

    return node;
  }

  private peek(): FormulaToken | undefined {
    return this.tokens[this.position];
  }

  private eat(type: FormulaKeywordToken): boolean {
    if (this.peek()?.type === type) {
      this.position += 1;

      return true;
    }

    return false;
  }

  private expectInteger(message: string): number {
    const token = this.peek();

    if (token?.type !== 'integer') {
      throw new Error(message);
    }

    this.position += 1;

    return token.value;
  }

  private expectKeyword(type: FormulaKeywordToken, message: string): void {
    if (!this.eat(type)) {
      throw new Error(message);
    }
  }

  private expression(): FormulaNode {
    let node = this.additive();

    const token = this.peek();

    if (token?.type === 'difficultyClass' || token?.type === 'armorClass') {
      this.position += 1;

      const target = this.expectInteger(
        'После КД/СЛ укажите число: d20 + 5 КД 15',
      );

      const check: CheckFormulaNode = {
        type: 'check',
        kind: token.type,
        target,
        roll: node,
      };

      // В «d20 + 6 СЛ 15 * 8d6 save half» урон стоит без скобок, поэтому
      // читается целым произведением — term(), а не отдельным atom().
      node = this.eat('multiply') ? this.onHit(check, this.term()) : check;
    }

    return node;
  }

  private additive(): FormulaNode {
    let node = this.term();

    for (;;) {
      const token = this.peek();

      if (token?.type !== 'plus' && token?.type !== 'minus') {
        return node;
      }

      this.position += 1;

      node = {
        type: 'binary',
        operator: token.type === 'plus' ? '+' : '-',
        left: node,
        right: this.term(),
      };
    }
  }

  private term(): FormulaNode {
    let node = this.atom();

    for (;;) {
      if (this.eat('multiply')) {
        const right = this.atom();

        // Умножение сразу после проверки читается как урон при попадании,
        // а не как арифметика: «(d20 + 5 КД 15) * (2d6 + 3)».
        node =
          node.type === 'check'
            ? this.onHit(node, right)
            : { type: 'binary', operator: '*', left: node, right };

        continue;
      }

      if (this.eat('divide')) {
        node = {
          type: 'binary',
          operator: '/',
          left: node,
          right: this.divisor(),
        };

        continue;
      }

      return node;
    }
  }

  /**
   * Дочитывает делитель, отсекая деление на ноль ещё при разборе.
   *
   * @returns Узел делителя
   */
  private divisor(): FormulaNode {
    const node = this.atom();

    if (node.type === 'number' && node.value === 0) {
      throw new Error('Делить на ноль нельзя');
    }

    return node;
  }

  /**
   * Дочитывает хвосты `crit (…)` и `save half` после урона при попадании.
   *
   * @param check - Уже разобранная проверка против СЛ или КД
   * @param damage - Уже разобранный урон при попадании
   * @returns Узел урона, зависящего от исхода проверки
   */
  private onHit(
    check: CheckFormulaNode,
    damage: FormulaNode,
  ): OnHitFormulaNode {
    const node: OnHitFormulaNode = {
      type: 'onHit',
      check,
      damage,
      criticalDamage: null,
      saveHalf: false,
    };

    for (;;) {
      if (this.eat('critical')) {
        this.expectKeyword(
          'parenOpen',
          'После crit укажите урон в скобках: crit (4d6 + 3)',
        );

        node.criticalDamage = this.expression();

        this.expectKeyword(
          'parenClose',
          'Не хватает закрывающей скобки после crit',
        );

        continue;
      }

      if (this.eat('save')) {
        this.expectKeyword('half', 'После save укажите half');
        node.saveHalf = true;

        continue;
      }

      return node;
    }
  }

  private atom(): FormulaNode {
    if (this.eat('parenOpen')) {
      const node = this.expression();

      this.expectKeyword('parenClose', 'Не хватает закрывающей скобки');

      return node;
    }

    if (this.eat('minus')) {
      return {
        type: 'binary',
        operator: '-',
        left: { type: 'number', value: 0 },
        right: this.atom(),
      };
    }

    const token = this.peek();

    if (token?.type === 'integer') {
      this.position += 1;

      return this.eat('dice')
        ? this.dice(token.value)
        : { type: 'number', value: token.value };
    }

    if (this.eat('dice')) {
      return this.dice(DICE_MIN_COUNT);
    }

    throw new Error('Ожидалось число или кость (например, 2d6)');
  }

  /**
   * Дочитывает кость вместе с модификаторами `kh` / `kl` и `r`.
   *
   * @param count - Число костей, прочитанное перед `d`
   * @returns Узел броска костей
   */
  private dice(count: number): DiceFormulaNode {
    const sides = this.expectInteger('После d укажите число граней: d6, d20…');

    if (count < DICE_MIN_COUNT || count > DICE_MAX_COUNT) {
      throw new Error(
        `Костей в одном броске — от ${DICE_MIN_COUNT} до ${DICE_MAX_COUNT}`,
      );
    }

    if (sides < DICE_MIN_SIDES || sides > DICE_MAX_SIDES) {
      throw new Error(
        `Граней у кости — от ${DICE_MIN_SIDES} до ${DICE_MAX_SIDES}`,
      );
    }

    const node: DiceFormulaNode = {
      type: 'dice',
      count,
      sides,
      keep: null,
      reroll: null,
    };

    for (;;) {
      const token = this.peek();

      if (token?.type === 'keepHighest' || token?.type === 'keepLowest') {
        this.position += 1;

        const amount = this.expectInteger(
          'После kh/kl укажите, сколько костей оставить',
        );

        if (amount < 1 || amount > count) {
          throw new Error(`kh/kl: оставить можно от 1 до ${count} костей`);
        }

        node.keep = {
          kind: token.type === 'keepHighest' ? 'highest' : 'lowest',
          amount,
        };

        continue;
      }

      if (token?.type === 'reroll') {
        this.position += 1;

        const threshold = this.expectInteger(
          'После r укажите порог переброса: d20r1',
        );

        if (threshold < 1 || threshold >= sides) {
          throw new Error(`Порог переброса — от 1 до ${sides - 1}`);
        }

        node.reroll = threshold;

        continue;
      }

      return node;
    }
  }
}

/**
 * Разбирает текст формулы в дерево узлов.
 *
 * @param source - Формула, введённая пользователем
 * @returns Корневой узел разобранной формулы
 * @throws Error с человекочитаемым сообщением, если формулу не удалось разобрать
 *
 * @example
 * parseFormula('(d20 + 5 КД 15) * (2d6 + 3) crit (4d6 + 3)');
 */
export function parseFormula(source: string): FormulaNode {
  return new FormulaParser(tokenizeFormula(source)).parse();
}
