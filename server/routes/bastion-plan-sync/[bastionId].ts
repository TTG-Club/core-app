import {
  checkPlanSyncAccess,
  closePlanSyncPeer,
  handlePlanSyncMessage,
  openPlanSyncPeer,
} from '#server/domain/bastion-plan-sync';

/**
 * Веб-сокет совместного рисования плана бастиона (протокол y-websocket).
 * Доступ проверяется при подключении тем же запросом к core-api, что и в
 * редакторе; право правки запоминается в контексте соединения.
 */
export default defineWebSocketHandler({
  /**
   * Проверяет доступ до подключения и запоминает его в контексте.
   *
   * @param request Запрос на подключение.
   */
  async upgrade(request) {
    const access = await checkPlanSyncAccess(request);

    request.context.bastionId = access.bastionId;
    request.context.canEdit = access.canEdit;
  },

  /**
   * Подключает участника к комнате плана.
   *
   * @param peer Соединение.
   */
  open(peer) {
    openPlanSyncPeer(peer);
  },

  /**
   * Передаёт сообщение участника в комнату.
   *
   * @param peer Соединение.
   * @param message Сообщение.
   */
  message(peer, message) {
    handlePlanSyncMessage(peer, message.uint8Array());
  },

  /**
   * Отключает участника при закрытии соединения.
   *
   * @param peer Соединение.
   */
  close(peer) {
    closePlanSyncPeer(peer);
  },

  /**
   * Отключает участника при ошибке соединения.
   *
   * @param peer Соединение.
   */
  error(peer) {
    closePlanSyncPeer(peer);
  },
});
