import { defineProvider } from '@nuxt/image/runtime';

export default defineProvider({
  getImage(src) {
    return { url: src };
  },
});
