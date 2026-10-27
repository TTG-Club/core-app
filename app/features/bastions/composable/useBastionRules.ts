import type { BastionRules } from '../model';

import { BASTION_RULES_API_PATH, bastionRulesSchema } from '../model';

/**
 * Загружает правила бастиона (`GET /api/v2/bastions/rules`): коды и подписи
 * приказов, пространств, требований, уровни специализированных сооружений.
 * Ответ проверяется схемой — по нему строятся селекты редактора.
 *
 * @returns Правила и готовые варианты для селектов редактора
 */
export async function useBastionRules() {
  const { data: rules, status } = await useAsyncData(
    'bastion-rules',
    async (): Promise<BastionRules> =>
      bastionRulesSchema.parse(await $fetch<unknown>(BASTION_RULES_API_PATH)),
    { dedupe: 'defer' },
  );

  const categoryItems = computed(() =>
    (rules.value?.categories ?? []).map((category) => ({
      label: category.name,
      value: category.value,
    })),
  );

  const spaceItems = computed(() =>
    (rules.value?.spaces ?? []).map((space) => ({
      label: `${space.name} (${space.squares} кв.)`,
      value: space.value,
    })),
  );

  // «Обслуживать» отдаётся всему бастиону: сооружению его не назначают
  const facilityOrderItems = computed(() =>
    (rules.value?.orders ?? [])
      .filter((order) => !order.bastionWide)
      .map((order) => ({ label: order.name, value: order.value })),
  );

  const prerequisiteItems = computed(() =>
    (rules.value?.prerequisites ?? []).map((prerequisite) => ({
      label: prerequisite.name,
      value: prerequisite.value,
    })),
  );

  const levelItems = computed(() =>
    (rules.value?.specialFacilities ?? []).map((progression) => ({
      label: String(progression.level),
      value: progression.level,
    })),
  );

  return {
    rules,
    status,
    categoryItems,
    spaceItems,
    facilityOrderItems,
    prerequisiteItems,
    levelItems,
  };
}
