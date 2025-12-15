import { computed, ref, watch } from 'vue';
import type { ClassLinkResponse } from '~classes/types';
import type { SelectMenuItem } from '#ui/components/SelectMenu.vue';
import {
  DEFAULT_LEVEL,
  MAX_CHARACTER_LEVEL,
  MAX_ADDITIONAL_CLASSES,
  MIN_SUBCLASS_LEVEL,
  FIRST_ADDITIONAL_CLASS_NUMBER,
} from '~multiclass/consts';

export interface AdditionalClass {
  id: string;
  classUrl?: string;
  subclassUrl?: string;
  level: number;
}

interface UseMulticlassDrawerProps {
  url: string;
  parent?: ClassLinkResponse;
}

export function useMulticlassDrawer(props: UseMulticlassDrawerProps) {
  const currentLevel = ref<number>(DEFAULT_LEVEL);

  const currentClassUrl = ref<string>(
    props.parent ? props.parent.url : props.url,
  );

  const currentSubclassUrl = ref<string | undefined>(
    props.parent ? props.url : undefined,
  );

  const selectedClassUrl = ref<string>();
  const selectedSubclassUrl = ref<string>();
  const selectedLevel = ref<number>(DEFAULT_LEVEL);

  const additionalClasses = ref<Array<AdditionalClass>>([]);

  const additionalClassSubclasses = ref<
    Record<string, Array<ClassLinkResponse> | undefined>
  >({});

  const initialMainClassUrl = computed(() =>
    props.parent ? props.parent.url : props.url,
  );

  watch(
    initialMainClassUrl,
    (newUrl) => {
      if (currentClassUrl.value !== newUrl) {
        currentClassUrl.value = newUrl;
      }
    },
    { immediate: true },
  );

  async function loadSubclassesForAdditionalClass(
    classId: string,
    classUrl: string | undefined,
  ) {
    if (!classUrl) {
      additionalClassSubclasses.value[classId] = [];

      return;
    }

    try {
      const subclasses = await $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${classUrl}/subclasses`,
      );

      additionalClassSubclasses.value[classId] = subclasses;
    } catch {
      additionalClassSubclasses.value[classId] = [];
    }
  }

  function getAdditionalClassSubclassItems(
    classId: string,
  ): Array<SelectMenuItem> {
    const subclasses = additionalClassSubclasses.value[classId] ?? [];

    return subclasses.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  }

  function getCurrentClassSubclassItems(
    subclasses: Array<ClassLinkResponse> | undefined,
  ): Array<SelectMenuItem> {
    if (!subclasses?.length) {
      return [];
    }

    return subclasses.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  }

  function getSubclassItems(
    subclasses: Array<ClassLinkResponse> | undefined,
  ): Array<SelectMenuItem> {
    if (!subclasses?.length) {
      return [];
    }

    return subclasses.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  }

  const sumAdditionalLevels = computed(() => {
    return additionalClasses.value
      .filter((c) => c.classUrl)
      .reduce((sum, c) => sum + c.level, 0);
  });

  const maxCurrentLevel = computed(() => {
    const secondLevel = selectedClassUrl.value ? selectedLevel.value : 0;

    const available =
      MAX_CHARACTER_LEVEL - secondLevel - sumAdditionalLevels.value;

    return Math.max(DEFAULT_LEVEL, Math.min(available, MAX_CHARACTER_LEVEL));
  });

  const maxSelectedLevel = computed(() => {
    const available =
      MAX_CHARACTER_LEVEL - currentLevel.value - sumAdditionalLevels.value;

    return Math.max(DEFAULT_LEVEL, Math.min(available, MAX_CHARACTER_LEVEL));
  });

  function getMaxLevelForAdditionalClass(classId: string): number {
    const currentSum = currentLevel.value;
    const secondSum = selectedClassUrl.value ? selectedLevel.value : 0;

    const otherAdditionalSum = additionalClasses.value
      .filter((c) => c.id !== classId && c.classUrl)
      .reduce((sum, c) => sum + c.level, 0);

    const available =
      MAX_CHARACTER_LEVEL - currentSum - secondSum - otherAdditionalSum;

    return Math.max(DEFAULT_LEVEL, Math.min(available, MAX_CHARACTER_LEVEL));
  }

  watch(currentClassUrl, () => {
    currentSubclassUrl.value = undefined;
  });

  watch(maxCurrentLevel, (maxLevel) => {
    if (currentLevel.value > maxLevel) {
      currentLevel.value = maxLevel;
    }
  });

  watch(maxSelectedLevel, (maxLevel) => {
    if (selectedClassUrl.value && selectedLevel.value > maxLevel) {
      selectedLevel.value = maxLevel;
    }
  });

  watch(currentLevel, (newLevel) => {
    if (newLevel <= MIN_SUBCLASS_LEVEL - 1) {
      currentSubclassUrl.value = undefined;
    }
  });

  watch(selectedClassUrl, () => {
    selectedSubclassUrl.value = undefined;
  });

  watch(selectedLevel, (newLevel) => {
    if (newLevel <= MIN_SUBCLASS_LEVEL - 1) {
      selectedSubclassUrl.value = undefined;
    }
  });

  function handleAddClass() {
    if (additionalClasses.value.length >= MAX_ADDITIONAL_CLASSES) {
      return;
    }

    additionalClasses.value.push({
      id: `class-${Date.now()}`,
      level: DEFAULT_LEVEL,
    });
  }

  function removeAdditionalClass(id: string) {
    const index = additionalClasses.value.findIndex((c) => c.id === id);

    if (index !== -1) {
      additionalClasses.value.splice(index, 1);

      const newSubclasses: Record<
        string,
        Array<ClassLinkResponse> | undefined
      > = {};

      Object.keys(additionalClassSubclasses.value).forEach((key) => {
        if (key !== id) {
          const subclasses = additionalClassSubclasses.value[key];

          if (subclasses !== undefined) {
            newSubclasses[key] = subclasses;
          }
        }
      });
      additionalClassSubclasses.value = newSubclasses;
    }
  }

  watch(
    () =>
      additionalClasses.value.map((c) => ({ id: c.id, classUrl: c.classUrl })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, classUrl }) => {
        const oldValue = oldValues?.find((o) => o.id === id);

        if (classUrl && (!oldValue || oldValue.classUrl !== classUrl)) {
          loadSubclassesForAdditionalClass(id, classUrl);
        } else if (!classUrl) {
          additionalClassSubclasses.value[id] = [];
        }
      });
    },
    { deep: true },
  );

  watch(
    () =>
      additionalClasses.value.map((c) => ({ id: c.id, classUrl: c.classUrl })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, classUrl }) => {
        const oldClass = oldValues?.find((o) => o.id === id);

        if (oldClass && oldClass.classUrl !== classUrl) {
          const additionalClass = additionalClasses.value.find(
            (c) => c.id === id,
          );

          if (additionalClass) {
            additionalClass.subclassUrl = undefined;
          }
        }
      });
    },
    { deep: true },
  );

  watch(
    () => additionalClasses.value.map((c) => ({ id: c.id, level: c.level })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, level }) => {
        const oldValue = oldValues?.find((o) => o.id === id);

        if (
          oldValue &&
          oldValue.level !== level &&
          level <= MIN_SUBCLASS_LEVEL - 1
        ) {
          const additionalClass = additionalClasses.value.find(
            (c) => c.id === id,
          );

          if (additionalClass) {
            additionalClass.subclassUrl = undefined;
          }
        }
      });
    },
    { deep: true },
  );

  watch(
    () => [
      currentLevel.value,
      selectedLevel.value,
      additionalClasses.value.map((c) => ({ id: c.id, level: c.level })),
    ],
    () => {
      additionalClasses.value.forEach((additionalClass) => {
        if (additionalClass.classUrl) {
          const maxLevel = getMaxLevelForAdditionalClass(additionalClass.id);

          if (additionalClass.level > maxLevel) {
            additionalClass.level = maxLevel;
          }
        }
      });
    },
    { deep: true },
  );

  function handleClear() {
    selectedClassUrl.value = undefined;
    selectedSubclassUrl.value = undefined;
    selectedLevel.value = DEFAULT_LEVEL;
    additionalClasses.value = [];
  }

  const canAddClass = computed(() => {
    return additionalClasses.value.length < MAX_ADDITIONAL_CLASSES;
  });

  function isCurrentSubclassDisabled(
    subclasses: Array<ClassLinkResponse> | undefined,
  ): boolean {
    return (
      !currentClassUrl.value ||
      !subclasses?.length ||
      currentLevel.value <= MIN_SUBCLASS_LEVEL - 1
    );
  }

  function isSelectedSubclassDisabled(
    subclasses: Array<ClassLinkResponse> | undefined,
  ): boolean {
    return (
      !selectedClassUrl.value ||
      !subclasses?.length ||
      selectedLevel.value <= MIN_SUBCLASS_LEVEL - 1
    );
  }

  function getAdditionalSubclassDisabled(
    classId: string,
    level: number,
  ): boolean {
    return (
      !additionalClasses.value.find((c) => c.id === classId)?.classUrl ||
      getAdditionalClassSubclassItems(classId).length === 0 ||
      level <= MIN_SUBCLASS_LEVEL - 1
    );
  }

  return {
    currentLevel,
    currentClassUrl,
    currentSubclassUrl,
    selectedClassUrl,
    selectedSubclassUrl,
    selectedLevel,
    additionalClasses,
    maxCurrentLevel,
    maxSelectedLevel,
    getMaxLevelForAdditionalClass,
    getAdditionalClassSubclassItems,
    getCurrentClassSubclassItems,
    getSubclassItems,
    handleAddClass,
    removeAdditionalClass,
    handleClear,
    canAddClass,
    isCurrentSubclassDisabled,
    isSelectedSubclassDisabled,
    getAdditionalSubclassDisabled,
    FIRST_ADDITIONAL_CLASS_NUMBER,
  };
}
