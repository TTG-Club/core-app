import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { h } from 'vue';
import { ConfigProvider } from 'ant-design-vue';
import { extractStyle } from 'ant-design-vue/es/_util/static-style-extract';
import {
  type ColorMode,
  THEME_VARIANTS,
  getThemeConfig,
} from '../app/shared/utils/theme';

export function extractStyles() {
  function getThemeCss(name: ColorMode) {
    return `html.${name}{${extractStyle((node) =>
      h(
        ConfigProvider,
        {
          theme: getThemeConfig(name),
        },
        {
          default: () => node,
        },
      ),
    )}}`;
  }

  function getResultCss() {
    const themes = Object.keys(THEME_VARIANTS) as Array<ColorMode>;

    return themes.map((name) => getThemeCss(name));
  }

  return fs.writeFile(
    fileURLToPath(new URL('../public/css/ant-themes.css', import.meta.url)),
    getResultCss(),
    {
      encoding: 'utf-8',
    },
  );
}
