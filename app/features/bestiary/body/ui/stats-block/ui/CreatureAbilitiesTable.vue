<script setup lang="ts">
  import type { CreatureAbilitiesResponse } from '~bestiary/types'; // или путь к твоим типам

  defineProps<CreatureAbilitiesResponse>();
</script>

<template>
  <div :class="$style.block">
    <div :class="$style.title">
      <div :class="$style.first"></div>

      <div :class="$style.first"></div>

      <div :class="$style.first">Мод</div>

      <div :class="$style.first">Спас</div>

      <div :class="$style.first"></div>

      <div :class="$style.first"></div>

      <div :class="$style.first">Мод</div>

      <div :class="$style.first">Спас</div>

      <div :class="$style.third"></div>

      <div :class="$style.third">Мод</div>

      <div :class="$style.third">Спас</div>
    </div>

    <div :class="$style.group">
      <div :class="$style.ability">
        <div>
          <div :class="$style.stat">Сил</div>

          <div>{{ str.value }}</div>

          <div>{{ str.mod }}</div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
          >
            {{ str.sav }}
          </div>
        </div>

        <div>
          <div :class="$style.stat">Лов</div>

          <div>{{ dex.value }}</div>

          <div>{{ dex.mod }}</div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
          >
            {{ dex.sav }}
          </div>
        </div>

        <div>
          <div :class="$style.stat">Тел</div>

          <div>{{ con.value }}</div>

          <div>{{ con.mod }}</div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
          >
            {{ con.sav }}
          </div>
        </div>
      </div>

      <div :class="$style.ability">
        <div>
          <div :class="$style.stat">Инт</div>

          <div>{{ int.value }}</div>

          <div>{{ int.mod }}</div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
          >
            {{ int.sav }}
          </div>
        </div>

        <div>
          <div :class="$style.stat">Мдр</div>

          <div>{{ wis.value }}</div>

          <div>{{ wis.mod }}</div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
          >
            {{ wis.sav }}
          </div>
        </div>

        <div>
          <div :class="$style.stat">Хар</div>

          <div>{{ chr.value }}</div>

          <div>{{ chr.mod }}</div>

          <div
            :class="{ [$style.boxed]: str.mod !== str.sav }"
            :data-is-sav="str.mod !== str.sav"
          >
            {{ chr.sav }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .block {
    display: flex;
    flex-direction: column;

    width: 100%;
    margin: 6px 12px;
    padding: 12px 16px;
    border-radius: 8px;

    background: var(--color-hover);

    @container (width > 600px) {
      width: 70%;
      margin-left: 16px;
    }

    .title {
      display: flex;
      width: 100%;
      font-size: 12px;

      .first {
        display: flex;
        flex: 1;
      }
    }

    .group {
      display: flex;

      @container (width > 600px) {
        flex-direction: column;
      }
    }

    .ability {
      display: flex;
      flex: 1;
      flex-direction: column;

      @container (width > 600px) {
        flex-direction: row;
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
      }
    }

    .boxed {
      font-weight: 500;
      color: var(--ui-text-bold);
    }
  }
</style>
