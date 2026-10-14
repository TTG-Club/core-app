import { SINGLE_LIBRARY_SECTION_COUNT } from './constants';

/** Строка библиотеки поля: что подставить и как это назвать. */
export interface LibraryOption {
  /** Название строки. */
  label: string;
  /** Что подставится в поле. */
  value: string;
  /** Раздел библиотеки; строки без раздела идут одним списком. */
  section?: string;
  /** Пояснение под строкой: где работает и как дописать под себя. */
  hint?: string;
}

/** Пункт выпадающего списка библиотеки: заголовок раздела либо строка. */
export interface LibraryMenuItem {
  /** Заголовок раздела или строка библиотеки. */
  type: 'label' | 'item';
  /** Подпись раздела либо название строки. */
  label: string;
  /** Что подставится в поле; у заголовка раздела значения нет. */
  value?: string;
  /** Пояснение строки, если его нужно показать. */
  description?: string;
}

/**
 * Подходит ли строка под поиск: по названию, значению и пояснению — автор ищет
 * и «урон», и «steps», и «только у заклинания».
 *
 * @param libraryOption строка библиотеки.
 * @param queryText поисковая строка в нижнем регистре.
 * @returns `true`, если строка подходит.
 */
function matchesLibraryQuery(
  libraryOption: LibraryOption,
  queryText: string,
): boolean {
  return [libraryOption.label, libraryOption.value, libraryOption.hint].some(
    (searchedField) => searchedField?.toLowerCase().includes(queryText),
  );
}

/**
 * Строки одного раздела пунктами выпадающего списка. Общее для раздела
 * пояснение стоит у каждой строки данных, но показывается только у первой
 * строки подряд: четырнадцать одинаковых строк под типами существ читать никто
 * не станет.
 *
 * @param sectionOptions строки одного раздела в порядке показа.
 * @returns пункты выпадающего списка.
 */
function toLibraryMenuRows(
  sectionOptions: ReadonlyArray<LibraryOption>,
): LibraryMenuItem[] {
  return sectionOptions.map((libraryOption, index) => ({
    type: 'item',
    label: libraryOption.label,
    value: libraryOption.value,
    description:
      libraryOption.hint === sectionOptions[index - 1]?.hint
        ? undefined
        : libraryOption.hint,
  }));
}

/**
 * Раскладывает строки библиотеки по разделам для выпадающего списка.
 *
 * Раздел встаёт туда, где встретилась его первая строка. Заголовки нужны,
 * только когда разделов на экране больше одного.
 *
 * @param libraryOptions строки библиотеки.
 * @param searchQuery поисковая строка в том виде, как её набрал автор.
 * @returns группы пунктов выпадающего списка.
 */
export function buildLibraryMenuGroups(
  libraryOptions: ReadonlyArray<LibraryOption>,
  searchQuery = '',
): LibraryMenuItem[][] {
  const queryText = searchQuery.trim().toLowerCase();

  const foundOptions = queryText
    ? libraryOptions.filter((libraryOption) =>
        matchesLibraryQuery(libraryOption, queryText),
      )
    : libraryOptions;

  const sectionLabels = [
    ...new Set(foundOptions.map((libraryOption) => libraryOption.section)),
  ];

  const hasSectionTitles = sectionLabels.length > SINGLE_LIBRARY_SECTION_COUNT;

  return sectionLabels.map((sectionLabel) => {
    const sectionRows = toLibraryMenuRows(
      foundOptions.filter(
        (libraryOption) => libraryOption.section === sectionLabel,
      ),
    );

    return hasSectionTitles && sectionLabel
      ? [{ type: 'label', label: sectionLabel }, ...sectionRows]
      : sectionRows;
  });
}
