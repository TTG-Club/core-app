declare module '#vue-router' {
  import '#vue-router';
  import type { ROLE } from '~/shared/types';

  interface RouteMeta {
    auth?: {
      roles?: Array<ROLE>;
    };
    backUrl?: string;
  }
}
