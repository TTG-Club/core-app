<script setup lang="ts">
  import { UiCollapse } from '~ui/collapse';
  import type { MulticlassData } from '../types';

  const { data } = defineProps<{
    data: MulticlassData;
  }>();

  const class1Name = computed(() => {
    if (data.class1.subclassUrl && data.class1.detail.parent) {
      return `${data.class1.detail.parent.name.rus} / ${data.class1.detail.name.rus}`;
    }

    return data.class1.detail.name.rus;
  });

  const class2Name = computed(() => {
    if (data.class2.subclassUrl && data.class2.detail.parent) {
      return `${data.class2.detail.parent.name.rus} / ${data.class2.detail.name.rus}`;
    }

    return data.class2.detail.name.rus;
  });

  // Объединение навыков из обоих классов
  const combinedSkills = computed(() => {
    const skills1 = data.class1.detail.proficiency.skill
      ? data.class1.detail.proficiency.skill.split(', ').map((s) => ({
          skill: s.trim(),
          source: class1Name.value,
        }))
      : [];

    const skills2 = data.class2.detail.proficiency.skill
      ? data.class2.detail.proficiency.skill.split(', ').map((s) => ({
          skill: s.trim(),
          source: class2Name.value,
        }))
      : [];

    // Объединяем и убираем дубликаты
    const allSkills = [...skills1, ...skills2];
    const unique = new Map<string, { skill: string; sources: Array<string> }>();

    for (const item of allSkills) {
      if (unique.has(item.skill)) {
        const existing = unique.get(item.skill)!;

        if (!existing.sources.includes(item.source)) {
          existing.sources.push(item.source);
        }
      } else {
        unique.set(item.skill, {
          skill: item.skill,
          sources: [item.source],
        });
      }
    }

    return Array.from(unique.values());
  });
</script>

<template>
  <UiCollapse default-open>
    <template #default> Владения</template>

    <template #content>
      <div class="mb-2">
        <span class="font-bold text-muted">Доспехи: </span>

        <span>{{ data.class1.detail.proficiency.armor || 'Нет' }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Оружие: </span>

        <span>{{ data.class1.detail.proficiency.weapon || 'Нет' }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted">Инструменты: </span>

        <span>{{ data.class1.detail.proficiency.tool || 'Нет' }}</span>
      </div>

      <div class="mb-2">
        <span class="font-bold text-muted"> Спасброски: </span>

        <div class="flex flex-col gap-1">
          <span>
            {{ data.class1.detail.savingThrows }}
            <span class="text-xs text-secondary"> ({{ class1Name }})</span>
          </span>

          <span
            v-if="
              data.class2.detail.savingThrows !==
              data.class1.detail.savingThrows
            "
          >
            {{ data.class2.detail.savingThrows }}
            <span class="text-xs text-secondary"> ({{ class2Name }})</span>
          </span>
        </div>
      </div>

      <div v-if="combinedSkills.length > 0">
        <span class="font-bold text-muted">Навыки: </span>

        <div class="flex flex-col gap-1">
          <span
            v-for="item in combinedSkills"
            :key="item.skill"
          >
            {{ item.skill }}
            <span
              v-if="item.sources.length > 0"
              class="text-xs text-secondary"
            >
              ({{ item.sources.join(', ') }})
            </span>
          </span>
        </div>
      </div>
    </template>
  </UiCollapse>
</template>
