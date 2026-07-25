/**
 * Отдаёт браузеру содержимое как файл через ссылку на blob. Работает только в
 * браузере: вызывается по действию пользователя (экспорт листа, выгрузка
 * изображения с канваса).
 *
 * @param blob содержимое файла.
 * @param fileName имя файла вместе с расширением.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
