/**
 * Методы массивов, которых нет в старых браузерах (Chrome и Android WebView
 * до 110, Safari до 16): без них страница падала с «toSorted is not a
 * function». Доопределяются при загрузке модуля — раньше любого кода страниц.
 */

type Comparator = (first: unknown, second: unknown) => number;

type Predicate = (
  item: unknown,
  index: number,
  list: Array<unknown>,
) => unknown;

/**
 * Добавляет массивам метод, если браузер его не знает. Родной метод не
 * трогает.
 *
 * @param name - Имя метода
 * @param method - Реализация метода; массив приходит в `this`
 */
function defineArrayMethod(name: string, method: unknown): void {
  if (name in Array.prototype) {
    return;
  }

  // Полифилл: метод добавляется только там, где браузер его не знает.
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, name, {
    value: method,
    writable: true,
    configurable: true,
  });
}

/**
 * Ищет с конца списка первый элемент, подходящий под условие.
 *
 * @param list - Список, в котором ищем
 * @param predicate - Условие отбора
 * @returns Индекс найденного элемента или `-1`, если подходящего нет
 */
function findLastIndexIn(list: Array<unknown>, predicate: Predicate): number {
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (predicate(list[index], index, list)) {
      return index;
    }
  }

  return -1;
}

defineArrayMethod(
  'toSorted',
  function toSorted(this: Array<unknown>, compare?: Comparator) {
    return [...this].sort(compare);
  },
);

defineArrayMethod('toReversed', function toReversed(this: Array<unknown>) {
  return [...this].reverse();
});

defineArrayMethod(
  'toSpliced',
  function toSpliced(
    this: Array<unknown>,
    start: number,
    deleteCount?: number,
    ...items: Array<unknown>
  ) {
    const copy = [...this];

    if (deleteCount === undefined) {
      copy.splice(start);
    } else {
      copy.splice(start, deleteCount, ...items);
    }

    return copy;
  },
);

defineArrayMethod(
  'with',
  function withItem(this: Array<unknown>, index: number, value: unknown) {
    const position = index < 0 ? this.length + index : index;

    if (position < 0 || position >= this.length) {
      throw new RangeError('Invalid index');
    }

    const copy = [...this];

    copy[position] = value;

    return copy;
  },
);

defineArrayMethod(
  'findLastIndex',
  function findLastIndex(this: Array<unknown>, predicate: Predicate) {
    return findLastIndexIn(this, predicate);
  },
);

defineArrayMethod(
  'findLast',
  function findLast(this: Array<unknown>, predicate: Predicate) {
    const index = findLastIndexIn(this, predicate);

    return index === -1 ? undefined : this[index];
  },
);

/**
 * Сам плагин ничего не делает: методы уже добавлены при загрузке модуля.
 * `enforce: 'pre'` ставит модуль первым среди плагинов.
 */
export default defineNuxtPlugin({
  name: 'array-polyfills',
  enforce: 'pre',
  setup() {},
});
