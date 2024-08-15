export const THEME_STORE_KEY = 'ttg-club-theme';

export const { store: theme } = useColorMode({
  attribute: 'data-theme',
  storageKey: THEME_STORE_KEY,
});
