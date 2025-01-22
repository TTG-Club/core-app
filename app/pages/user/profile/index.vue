<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';
  import type { UserProfile } from '~/shared/types';

  const { data, status } = useFetch<UserProfile>('/api/user/profile', {
    onResponseError(context) {
      if (context.response.status === StatusCodes.UNAUTHORIZED) {
        return navigateTo({ name: 'index' });
      }

      return navigateTo({ name: 'index' });
    },
  });
</script>

<template>
  <pre v-if="status === 'success'">{{ data }}</pre>

  <span v-else-if="status === 'error'">error</span>

  <span v-else>loading</span>
</template>
