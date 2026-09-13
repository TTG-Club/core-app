/** Ссылка на страницу сайта — переход роутером Nuxt */
interface LegalDocumentPageLink {
  /** Подпись ссылки */
  label: string;

  /** Иконка перед подписью */
  icon: string;

  /** Путь страницы сайта */
  to: string;

  href?: never;
}

/** Ссылка вне роутера: почта или внешний сайт */
interface LegalDocumentExternalLink {
  /** Подпись ссылки */
  label: string;

  /** Иконка перед подписью */
  icon: string;

  /** Адрес `mailto:` или внешней страницы */
  href: string;

  to?: never;
}

/** Ссылка в конце блока документа */
export type LegalDocumentLink =
  | LegalDocumentExternalLink
  | LegalDocumentPageLink;

/** Сведение в карточке блока: название и значение, например «Срок — пока существует учётная запись» */
export interface LegalDocumentFact {
  /** Название сведения */
  label: string;

  /** Значение сведения */
  value: string;
}

/** Блок документа: заголовок и содержимое без вложенных блоков */
export interface LegalDocumentBlock {
  /** Идентификатор блока, он же якорь для ссылки на него */
  id: string;

  /** Заголовок блока */
  title: string;

  /** Абзацы текста */
  paragraphs?: Array<string>;

  /** Сведения карточкой «название — значение» после абзацев */
  facts?: Array<LegalDocumentFact>;

  /** Пункты списка */
  bullets?: Array<string>;

  /** Ссылки после текста */
  links?: Array<LegalDocumentLink>;
}

/** Раздел документа: блок верхнего уровня, который может содержать подразделы */
export interface LegalDocumentSection extends LegalDocumentBlock {
  /** Иконка перед заголовком */
  icon?: string;

  /** Метка у заголовка — например, что без этих данных сайт не работает */
  badge?: string;

  /** Подразделы — вложенные блоки с заголовками уровнем ниже */
  subsections?: Array<LegalDocumentBlock>;
}
