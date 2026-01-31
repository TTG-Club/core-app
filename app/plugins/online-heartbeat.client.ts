import { useOnlineHeartbeat } from '~/composables/useOnlineHeartbeat';

export default defineNuxtPlugin(() => {
  const { start } = useOnlineHeartbeat({
    heartbeatMs: 5 * 60 * 1000,
    debug: false,
  });

  start();
});
