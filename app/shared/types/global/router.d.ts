declare module '#vue-router' {
  import '#vue-router';
  import type { Role } from '~/shared/types';

  interface RouteMeta {
    auth?: {
      roles?: Array<Role>;
    };
  }
}
