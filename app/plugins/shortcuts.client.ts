import { useGlobalSearch } from '~/features/search/model/composable';

export default defineNuxtPlugin(() => {
  const { open } = useGlobalSearch();

  defineShortcuts({
    '\\': () => open(),
    '/': () => open(),
  });
});
