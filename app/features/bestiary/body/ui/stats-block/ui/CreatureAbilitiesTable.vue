<script setup lang="ts">
  import { DiceRollerLink } from '~dice-roller/link'; // или путь к твоим типам

  import type { CreatureAbilitiesResponse } from '~bestiary/types';

  defineProps<CreatureAbilitiesResponse>();
</script>

<template>
  <div
    :class="$style.block"
    class="flex flex-col"
  >
    <div :class="$style.title">
      <div :class="$style.row">
        <div
          :class="$style.first"
          class="min-w-8"
        />

        <div
          :class="$style.first"
          class="max-w-7"
        />

        <div :class="$style.first">Мод</div>

        <div
          :class="$style.first"
          class="min-w-8"
        >
          Спас
        </div>
      </div>

      <div :class="$style.row">
        <div
          :class="$style.first"
          class="min-w-8"
        />

        <div
          :class="$style.first"
          class="max-w-7"
        />

        <div :class="$style.first">Мод</div>

        <div
          :class="$style.first"
          class="min-w-8"
        >
          Спас
        </div>
      </div>

      <div :class="$style.rowThird">
        <div
          :class="$style.third"
          class="min-w-8"
        />

        <div
          :class="$style.third"
          class="max-w-7"
        />

        <div :class="$style.third">Мод</div>

        <div
          :class="$style.third"
          class="min-w-8"
        >
          Спас
        </div>
      </div>
    </div>

    <div :class="$style.group">
      <div :class="$style.ability">
        <div>
          <div
            :class="$style.stat"
            class="min-w-8"
          >
            Сил
          </div>

          <div class="max-w-7">{{ str.value }}</div>

          <div class="justify-end">
            <DiceRollerLink :notation="`1к20${str.mod}`">
              {{ str.mod }}
            </DiceRollerLink>
          </div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
            class="min-w-8 justify-end"
          >
            <DiceRollerLink :notation="`1к20${str.sav}`">
              {{ str.sav }}
            </DiceRollerLink>
          </div>
        </div>

        <div :class="$style.row">
          <div
            :class="$style.stat"
            class="min-w-8"
          >
            Лов
          </div>

          <div class="max-w-7">{{ dex.value }}</div>

          <DiceRollerLink :notation="`1к20${dex.mod}`">
            {{ dex.mod }}
          </DiceRollerLink>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
            class="min-w-8 justify-end"
          >
            <DiceRollerLink :notation="`1к20${dex.sav}`">
              {{ dex.sav }}
            </DiceRollerLink>
          </div>
        </div>

        <div :class="$style.row">
          <div
            :class="$style.stat"
            class="min-w-8"
          >
            Тел
          </div>

          <div class="max-w-7">{{ con.value }}</div>

          <div class="justify-end">
            <DiceRollerLink :notation="`1к20${con.mod}`">
              {{ con.mod }}
            </DiceRollerLink>
          </div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
            class="min-w-8 justify-end"
          >
            <DiceRollerLink :notation="`1к20${con.sav}`">
              {{ con.sav }}
            </DiceRollerLink>
          </div>
        </div>
      </div>

      <div :class="$style.ability">
        <div>
          <div
            :class="$style.stat"
            class="min-w-8"
          >
            Инт
          </div>

          <div class="max-w-7">{{ int.value }}</div>

          <div class="justify-end">
            <DiceRollerLink :notation="`1к20${int.mod}`">
              {{ int.mod }}
            </DiceRollerLink>
          </div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
            class="min-w-8 justify-end"
          >
            <DiceRollerLink :notation="`1к20${int.sav}`">
              {{ int.sav }}
            </DiceRollerLink>
          </div>
        </div>

        <div :class="$style.row">
          <div
            :class="$style.stat"
            class="min-w-8"
          >
            Мдр
          </div>

          <div class="max-w-7">{{ wis.value }}</div>

          <div class="justify-end">
            <DiceRollerLink :notation="`1к20${wis.mod}`">
              {{ wis.mod }}
            </DiceRollerLink>
          </div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
            class="min-w-8 justify-end"
          >
            <DiceRollerLink :notation="`1к20${wis.sav}`">
              {{ wis.sav }}
            </DiceRollerLink>
          </div>
        </div>

        <div :class="$style.row">
          <div
            :class="$style.stat"
            class="min-w-8"
          >
            Хар
          </div>

          <div class="max-w-7">{{ chr.value }}</div>

          <div class="justify-end">
            <DiceRollerLink :notation="`1к20${chr.mod}`">
              {{ chr.mod }}
            </DiceRollerLink>
          </div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
            class="min-w-8 justify-end"
          >
            <DiceRollerLink :notation="`1к20${chr.sav}`">
              {{ chr.sav }}
            </DiceRollerLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .block {
    width: 100%;
    margin: 6px 12px;
    padding: 12px 16px;
    border-radius: 8px;

    background: var(--color-hover);

    @container (width > 600px) {
      width: 90%;
      margin-left: 16px;
    }

    .title {
      display: flex;
      gap: 16px;
      width: 100%;
      font-size: 12px;

      @container (width > 600px) {
        gap: 48px;
      }

      .row {
        display: flex;
        width: 100%;
      }

      .rowThird {
        display: none;

        @container (width > 600px) {
          display: flex;
          width: 100%;
        }
      }

      .first {
        display: flex;
        flex: 1;
        justify-content: flex-end;
      }
    }

    .group {
      display: flex;
      gap: 8px;

      @container (width > 600px) {
        flex-direction: column;
        gap: 0;
      }
    }

    .ability {
      display: flex;
      flex: 1;
      flex-direction: column;

      @container (width > 600px) {
        flex-direction: row;
        gap: 24px;
      }

      &:nth-child(2) {
        padding-left: 8px;
        border-left: 1px solid;

        @container (width > 600px) {
          padding-left: 0;
          border-left: 0;
        }
      }

      .row {
        padding-left: 0;
        border-left: 0;

        @container (width > 600px) {
          padding-left: 24px;
          border-left: 1px solid;
        }
      }

      .stat {
        font-weight: 600;
        color: var(--ui-text-bold);
        text-align: left;
      }

      div {
        display: flex;
        flex: 1;
      }
    }

    .third {
      display: none;

      @container (width > 600px) {
        display: flex;
        flex: 1;
        justify-content: flex-end;
      }
    }

    .boxed {
      font-weight: 500;
      color: var(--ui-text-bold);
    }
  }
</style>
