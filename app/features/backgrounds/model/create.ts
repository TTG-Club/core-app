import type { AbilityKey } from '~/shared/types';
import type { ActiveEffect } from '~active-effects/model';
import type {
  FeatEditorRows,
  FeatEntityRef,
  FeatMechanics,
} from '~feats/model';
import type { EditorBaseInfoState, EquipmentOptionCreate } from '~ui/editor';

/** Владение инструментами на выбор игрока: «музыкальный инструмент на выбор». */
export interface BackgroundToolChoice {
  /** Сколько инструментов выбирает игрок. */
  count: number | undefined;

  /** Пул выбора; пустой — выбирают любой инструмент. */
  from: Array<FeatEntityRef>;
}

export interface BackgroundCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  abilityScores: Array<AbilityKey>; // характеристики
  featUrl: string | undefined; // url черты
  featSuffix: string | undefined; // суффикс черты

  /**
   * Черты на выбор, когда предыстория не называет одну. Рядом с `featUrl`, а не
   * вместо него: у предысторий книги черта одна, и по ней раздел фильтруется.
   */
  featChoices: Array<FeatEntityRef>;

  skillsProficiencies: Array<string>; // навыки
  toolProficiency: string; // владение инструментами текстом (легаси)

  /**
   * Владение инструментами ссылками на карточки раздела «Предметы» — главнее
   * текста: по ним лист персонажа выдаёт владение, а выгрузка переводит адрес
   * страницы в ключ вокабуляра стола.
   */
  toolProficiencies: Array<FeatEntityRef>;

  /** Владение инструментами на выбор; не задано — выбора нет. */
  toolChoice: BackgroundToolChoice | undefined;

  equipment: string; // снаряжение
  startingEquipment: Array<EquipmentOptionCreate>; // снаряжение вариантами выбора

  /**
   * Расширенные дары предыстории: владения, языки, защиты, чувства, выборы
   * игрока и выдаваемые заклинания.
   *
   * Моделью черты, как они лежат в core-api (`Background.mechanics`): набор
   * даров у предыстории тот же, и в системе они хранятся в том же блобе. Свои
   * типы означали бы вторую копию тех же полей и второй разбор.
   */
  mechanics: FeatMechanics | undefined;

  /**
   * Активные эффекты предыстории в вокабуляре VTTG — та же модель, что у черты,
   * заклинания и магического предмета. Рядом с дарами, а не внутри них: дары
   * лист проставляет сам, а эффект меняет числа готовой формулой.
   */
  activeEffects: Array<ActiveEffect>;

  /**
   * Строки редактора даров: форма правит их, а не блоки механики. Перед
   * отправкой из них пересобирается `mechanics`, а само поле обнуляется — в
   * теле запроса ему места нет.
   */
  editorRows: FeatEditorRows | undefined;
}
