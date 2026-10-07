import { useBuildUpdate } from '~infrastructure/build-update/composables';

/** Автоматически подхватывает новую выкладку сайта без Ctrl+Shift+R. */
export default defineNuxtPlugin(() => {
  useBuildUpdate();
});
