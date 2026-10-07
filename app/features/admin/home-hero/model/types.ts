/** Экран, на котором админка показывает превью шапки главной. */
export interface HomeHeroPreviewDevice {
  id: string;
  label: string;
  /** Ширина экрана в CSS-пикселях — по ней срабатывают брейкпоинты шапки. */
  width: number;
  height: number;
}
