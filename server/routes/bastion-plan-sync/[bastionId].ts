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
  async upgrade(request) {
    const access = await checkPlanSyncAccess(request);

    request.context.bastionId = access.bastionId;
    request.context.canEdit = access.canEdit;
  },

  open(peer) {
    openPlanSyncPeer(peer);
  },

  message(peer, message) {
    handlePlanSyncMessage(peer, message.uint8Array());
  },

  close(peer) {
    closePlanSyncPeer(peer);
  },

  error(peer) {
    closePlanSyncPeer(peer);
  },
});
