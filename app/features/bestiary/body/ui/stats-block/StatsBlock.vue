<script setup lang="ts">
  import type { CreatureDetailResponse } from '../../../model';

  import { DiceRollerLink } from '~dice-roller/link';
  import { MarkupRender } from '~ui/markup';

  import {
    formatCreatureInventoryNote,
    getCreatureInventoryEntries,
  } from '../../../model';
  import { CreatureAbilitiesTable, CreatureInventoryLink } from './ui';

  type Props = Pick<
    CreatureDetailResponse,
    'ac' | 'cr' | 'initiative' | 'hit' | 'speed' | 'abilities'
  >
    & Pick<
      Partial<CreatureDetailResponse>,
      | 'skills'
      | 'equipments'
      | 'inventory'
      | 'inventoryText'
      | 'vulnerability'
      | 'resistance'
      | 'immunity'
      | 'sense'
      | 'languages'
    >;

  const { equipments, inventory, inventoryText } = defineProps<Props>();

  /**
   * Позиции инвентаря для показа: название, пояснение в скобках и адрес
   * карточки. Ссылкой становится только название — «Копьё (6)».
   */
  const inventoryEntries = computed(() =>
    getCreatureInventoryEntries(inventory).map((entry) => ({
      name: entry.name,
      note: formatCreatureInventoryNote(entry.quantity, entry.description),
      section: entry.section,
      url: entry.url,
    })),
  );

  /** Инвентарь заведён — показываем его. */
  const hasInventory = computed(
    () => inventoryEntries.value.length > 0 || Boolean(inventoryText),
  );

  /**
   * Снаряжение строкой старого импорта — запасной вид для существ, которым
   * инвентарь ещё не завели: иначе одно и то же было бы написано дважды.
   */
  const legacyEquipments = computed(() =>
    hasInventory.value ? '' : (equipments ?? ''),
  );
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.row">
      <div :class="$style.item">
        <span :class="$style.name">КД: </span>

        <span>{{ ac }}</span>
      </div>

      <div :class="$style.item">
        <span :class="$style.name">Инициатива: </span>

        <span>
          <DiceRollerLink :notation="`1к20${initiative.value}`">
            {{ initiative.value }}
          </DiceRollerLink>
          ({{ initiative.label }})
        </span>
      </div>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Хиты: </span>

      <span>
        {{ hit.hit }}
        <span v-if="hit.formula">
          (<DiceRollerLink :notation="`{(${hit.formula}), 1}вл1`">
            {{ hit.formula }} </DiceRollerLink
          >)
        </span>
        {{ hit.text }}
      </span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Скорость: </span>

      <span>{{ speed }}</span>
    </div>

    <CreatureAbilitiesTable v-bind="abilities" />

    <div
      v-if="skills?.length"
      :class="$style.item"
    >
      <span :class="$style.name">Навыки: </span>

      <span>
        <template
          v-for="(skill, index) in skills"
          :key="`${skill.label}-${index}`"
        >
          <span v-if="index > 0">, </span>

          <span>{{ skill.label }} </span>&nbsp;

          <DiceRollerLink :notation="`1к20${skill.value}`">
            {{ skill.value }}
          </DiceRollerLink>
        </template>
      </span>
    </div>

    <div
      v-if="hasInventory"
      :class="$style.item"
    >
      <span :class="$style.name">Инвентарь: </span>

      <span>
        <template
          v-for="(entry, index) in inventoryEntries"
          :key="index"
        >
          <template v-if="index">, </template>

          <CreatureInventoryLink
            v-if="entry.url"
            :section="entry.section"
            :url="entry.url"
            :label="entry.name"
          />

          <template v-else>{{ entry.name }}</template>

          <template v-if="entry.note"> ({{ entry.note }})</template>
        </template>

        <template v-if="inventoryEntries.length && inventoryText">; </template>

        <MarkupRender
          v-if="inventoryText"
          :render-node="inventoryText"
        />
      </span>
    </div>

    <div
      v-if="legacyEquipments"
      :class="$style.item"
    >
      <span :class="$style.name">Снаряжение: </span>

      <MarkupRender :render-node="legacyEquipments" />
    </div>

    <div
      v-if="vulnerability"
      :class="$style.item"
    >
      <span :class="$style.name">Уязвимости: </span>

      <span>{{ vulnerability }}</span>
    </div>

    <div
      v-if="resistance"
      :class="$style.item"
    >
      <span :class="$style.name">Сопротивления: </span>

      <span>{{ resistance }}</span>
    </div>

    <div
      v-if="immunity"
      :class="$style.item"
    >
      <span :class="$style.name">Иммунитеты: </span>

      <span>{{ immunity }}</span>
    </div>

    <span
      v-if="sense"
      :class="$style.item"
    >
      <span :class="$style.name">Чувства: </span>

      <span>{{ sense }}</span>
    </span>

    <div
      v-if="languages"
      :class="$style.item"
    >
      <span :class="$style.name">Языки: </span>

      <span>{{ languages }}</span>
    </div>

    <div :class="$style.item">
      <UTooltip text="Показатель опасности (CR)">
        <span :class="$style.name">ПО: </span>
      </UTooltip>

      <span>{{ cr }}</span>
    </div>
  </div>
</template>

<style module lang="scss">
  .stats {
    container-type: inline-size;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;

    width: 100%;
    min-width: 272px;
    padding: 8px 0;
    border: 1px solid var(--ui-border);
    border-radius: 8px;

    background-color: var(--ui-bg-muted);

    .row {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;

      @container (width > 600px) {
        justify-content: left;
      }

      .item {
        min-width: 0;
      }
    }

    .item {
      min-width: 100%;
      padding: 6px 16px;

      .name {
        font-weight: 600;
        color: var(--ui-text-bold);
      }
    }
  }
</style>
