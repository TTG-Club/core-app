import type { RevisionOperation } from './types';

export const REVISION_DATE_FORMAT = 'DD.MM.YYYY HH:mm';
export const REVISION_SELECT_PLACEHOLDER = 'Выберите ревизию';
export const REVISION_SELECT_EMPTY_TEXT = 'Ревизии не найдены';
export const REVISION_LOAD_ERROR_TITLE = 'Ошибка загрузки ревизии';
export const REVISION_LOAD_ERROR_DESCRIPTION =
  'Не удалось подставить данные выбранной ревизии в форму';

export const REVISION_ENTITY_TYPES = {
  BACKGROUND: 'background',
  CLASS: 'class',
  CREATURE: 'creature',
  FEAT: 'feat',
  GLOSSARY: 'glossary',
  ITEM: 'item',
  MAGIC_ITEM: 'magicItem',
  SPECIES: 'species',
  SPELL: 'spell',
};

export const REVISION_OPERATION_LABELS: Record<RevisionOperation, string> = {
  CREATE: 'Создание',
  UPDATE: 'Изменение',
  DELETE: 'Удаление',
  REVERT: 'Восстановление',
};
