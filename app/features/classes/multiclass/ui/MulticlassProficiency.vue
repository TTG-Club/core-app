<script setup lang="ts">
  import { UiCollapse } from '~ui/collapse';
  import type { MulticlassData } from '../types';

  const { data } = defineProps<{
    data: MulticlassData;
  }>();

  const classNames = computed(() =>
    data.classes.map((c) => {
      if (c.subclassUrl && c.detail.parent) {
        return `${c.detail.parent.name.rus} / ${c.detail.name.rus}`;
      }

      return c.detail.name.rus;
    }),
  );

  const armorProficiency = computed(() => {
    const profs: string[] = [];

    data.classes.forEach((classItem, index) => {
      if (classItem.detail.proficiency.armor) {
        profs.push(
          `${classItem.detail.proficiency.armor} (${classNames.value[index]})`,
        );
      }
    });

    return profs.join(', ') || 'Нет';
  });

  const weaponProficiency = computed(() => {
    const profs: string[] = [];

    data.classes.forEach((classItem, index) => {
      if (classItem.detail.proficiency.weapon) {
        profs.push(
          `${classItem.detail.proficiency.weapon} (${classNames.value[index]})`,
        );
      }
    });

    return profs.join(', ') || 'Нет';
  });

  const toolProficiency = computed(() => {
    const profs: string[] = [];

    data.classes.forEach((classItem, index) => {
      if (classItem.detail.proficiency.tool) {
        profs.push(
          `${classItem.detail.proficiency.tool} (${classNames.value[index]})`,
        );
      }
    });

    return profs.join(', ') || 'Нет';
  });

  const skillProficiency = computed(() => {
    const profs: string[] = [];

    data.classes.forEach((classItem, index) => {
      if (classItem.detail.proficiency.skill) {
        profs.push(
          `${classItem.detail.proficiency.skill} (${classNames.value[index]})`,
        );
      }
    });

    return profs.join(', ') || 'Нет';
  });
</script>

<template>
  <UiCollapse default-open>
    <template #default> Владения</template>

    <template #content>
      <div class="mb-2">
        <span class="font-bold text-muted">Доспехи: </span>

        <span>{{ armorProficiency }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Оружие: </span>

        <span>{{ weaponProficiency }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Инструменты: </span>

        <span>{{ toolProficiency }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted"> Навыки: </span>

        <span>{{ skillProficiency }}</span>
      </div>
    </template>
  </UiCollapse>
</template>
