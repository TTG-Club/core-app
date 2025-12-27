import { computed } from 'vue';
import type { ClassInMulticlass } from '~multiclass/types';

interface UseMulticlassLevelInfoProps {
  characterLevel: number;
  multiclass: Array<ClassInMulticlass>;
}

export function useMulticlassLevelInfo(props: UseMulticlassLevelInfoProps) {
  const containerClasses = computed(() => {
    return 'flex w-full min-w-72 flex-col gap-4';
  });

  const cardClasses = computed(() => {
    return [
      'w-full overflow-hidden bg-muted',
      'rounded-lg border border-default',
    ];
  });

  const cardContentClasses = computed(() => {
    return 'flex w-full flex-row items-center justify-between gap-2 px-4 py-1.5';
  });

  const hasMulticlass = computed(() => {
    return props.multiclass.length > 0;
  });

  return {
    containerClasses,
    cardClasses,
    cardContentClasses,
    hasMulticlass,
  };
}
