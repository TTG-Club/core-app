import { computed } from 'vue';
import type { MulticlassDetailResponse } from '~multiclass/types';

interface UseMulticlassClassesProps {
  detail: MulticlassDetailResponse;
}

export function useMulticlassClasses(_props: UseMulticlassClassesProps) {
  const sidebarClasses = computed(() => {
    return [
      'flex w-full shrink-0 flex-col gap-4',
      '@min-xl:@max-3xl:flex-row @min-3xl:w-80',
    ];
  });

  const containerClasses = computed(() => {
    return ['flex flex-col gap-6', '@min-3xl:flex-row @min-3xl:gap-7'];
  });

  const contentClasses = computed(() => {
    return 'flex min-w-0 flex-auto flex-col gap-6';
  });

  const tableWrapperClasses = computed(() => {
    return 'flex min-w-0 flex-col gap-2';
  });

  return {
    sidebarClasses,
    containerClasses,
    contentClasses,
    tableWrapperClasses,
  };
}
