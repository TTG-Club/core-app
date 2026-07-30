export interface EquipmentItemCreate {
  url: string | undefined;
  quantity: number | undefined;
  description: string | undefined;
}

export interface EquipmentOptionCreate {
  items: Array<EquipmentItemCreate>;
  coins: number | undefined;
  /**
   * Тип монет варианта. В редакторе не задаётся — API проставляет золото по умолчанию,
   * поле нужно, чтобы сохранённое значение не терялось при повторном сохранении.
   */
  coin?: string;
}
