/** Раздел сайта, на который ведут ссылки блока привязок. */
export type AffiliationSection =
  | 'backgrounds'
  | 'classes'
  | 'feats'
  | 'species';

/** Ссылка на сущность раздела в блоке привязок. */
export interface AffiliationItem {
  url: string;
  name: string;
}
