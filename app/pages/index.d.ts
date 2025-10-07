import type { AlertProps } from '#ui/components/Alert.vue';
import type { AnchorScrollPageMetaCustomOptions, Role } from '~/shared/types';

declare module 'vue-router' {
  export interface RouteMeta {
    // Управление алертом на странице
    alert?: Pick<AlertProps, 'description' | 'color' | 'title' | 'icon'>;

    // Управление доступом по ролям
    auth?: {
      roles?: Array<Role>;
    };

    // Управление скролом к якорю
    anchorScroll?: AnchorScrollPageMetaCustomOptions;
  }
}

declare module 'nuxt/app' {
  export interface PageMeta {
    // Управление алертом на странице
    alert?: Pick<AlertProps, 'description' | 'color' | 'title' | 'icon'>;

    // Управление доступом по ролям
    auth?: {
      roles?: Array<Role>;
    };

    // Управление скролом к якорю
    anchorScroll?: AnchorScrollPageMetaCustomOptions;
  }
}

export {};
