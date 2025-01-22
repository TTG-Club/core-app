<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { PageHeader, PageContainer } from '~/features/page';
  import type {
    SpellCastingTime,
    SpellCreate,
    SpellMaterialComponent,
  } from '~/shared/types';
  import { ValidationBase, ValidationSpell } from '~/shared/utils';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import { isEqual } from 'lodash-es';
  import type { FormInstance } from 'ant-design-vue';

  import {
    SelectSource,
    SelectTags,
    InputUrl,
    SelectComparison,
    SelectDistanceType,
    SelectDurationType,
    SelectSchool,
    SelectSpecie,
    SelectTimeType,
  } from '../ui';

  const formRef = useTemplateRef<FormInstance>('formRef');

  const getEmptyCastingTime = (): SpellCastingTime => ({
    value: undefined,
    type: undefined,
    custom: undefined,
  });

  const getEmptyMaterialComponent = (): SpellMaterialComponent => ({
    name: '',
    price: undefined,
    comparison: undefined,
    consumable: false,
  });

  const form = ref<SpellCreate>({
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    source: {
      url: undefined,
      page: undefined,
    },
    description: '',
    upper: undefined,
    level: 0,
    school: undefined,
    ritual: false,
    concentration: false,
    distance: {
      type: undefined,
      value: undefined,
      custom: undefined,
    },
    duration: {
      value: undefined,
      type: undefined,
      custom: undefined,
    },
    time: [getEmptyCastingTime()],
    components: {
      v: false,
      s: false,
      m: [getEmptyMaterialComponent()],
    },
    affiliation: {
      classes: [],
      archetypes: [],
      species: [],
      origins: [],
    },
    tags: [],
  });

  const spellLevels = Array.from(Array(10)).map((_, index) => ({
    label: !index ? 'Заговор' : `${index} круг`,
    value: index,
  }));

  const isCustomDisabled = computed(() => ({
    distance: !!form.value.distance.value || !!form.value.distance.type,
    duration: !!form.value.duration.value || !!form.value.duration.type,
  }));

  const isDefaultDisabled = computed(() => ({
    distance: !!form.value.distance.custom,
    duration: !!form.value.duration.custom,
  }));

  const handleBookChange = (value: SelectValue) => {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  };

  onMounted(() => {
    formRef.value?.validate();
  });
</script>

<template>
  <PageContainer>
    <PageHeader title="Создание нового заклинания">
      <template #actions>
        <ATooltip title="Закрыть">
          <AButton
            type="text"
            @click.left.exact.prevent="navigateTo('/workshop/spells')"
          >
            <template #icon>
              <SvgIcon icon="close" />
            </template>
          </AButton>
        </ATooltip>
      </template>
    </PageHeader>

    <AForm
      ref="formRef"
      layout="vertical"
      :model="form"
    >
      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Основная информация"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="8">
          <AFormItem
            label="Название"
            :name="['name', 'rus']"
            :rules="[ValidationBase.ruleRusName()]"
          >
            <AInput
              v-model:value="form.name.rus"
              placeholder="Введи название"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Название (англ.)"
            tooltip="Английское название"
            :name="['name', 'eng']"
            :rules="[ValidationBase.ruleEngName()]"
          >
            <AInput
              v-model:value="form.name.eng"
              placeholder="Введи английское название"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Название (альт.)"
            tooltip="Альтернативные названия. Используется для поиска и СЕО."
            :name="['name', 'alt']"
          >
            <SelectTags
              v-model="form.name.alt"
              placeholder="Введи альтернативные названия"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ARow :gutter="16">
        <ACol :span="16">
          <AFormItem
            label="Источник"
            tooltip="Книга, из которой взята информация о виде, если она существует"
            :name="['source', 'url']"
          >
            <SelectSource
              :model-value="form.source.url"
              @update:model-value="handleBookChange"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Страница в источнике"
            tooltip="Номер страницы книги, откуда была взята информация о виде, если выбрана сама книга"
            :name="['source', 'page']"
            :rules="[ValidationBase.ruleSourcePage(!!form.source.url)]"
          >
            <AInputNumber
              v-model:value="form.source.page"
              :disabled="!form.source.url"
              :precision="0"
              placeholder="Введи номер страницы"
              min="0"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ARow :gutter="16">
        <ACol :span="12">
          <AFormItem
            label="Теги"
            tooltip="Используются для поиска и СЕО"
            :name="['tags']"
          >
            <SelectTags
              v-model="form.tags"
              placeholder="Введи теги"
            />
          </AFormItem>
        </ACol>

        <ACol :span="12">
          <AFormItem
            label="URL"
            tooltip="Менять только при необходимости, т.к. URL генерируется автоматически при вводе английского названия"
            :name="['url']"
            :rules="[ValidationSpell.ruleUrl()]"
          >
            <InputUrl
              v-model="form.url"
              :eng-name="form.name.eng"
              :source-url="form.source.url"
              addon-before="https://ttg.club/spells/"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ARow :gutter="16">
        <ACol :span="4">
          <AFormItem
            label="Уровень заклинания"
            :name="['level']"
          >
            <ASelect
              v-model:value="form.level"
              placeholder="Выбери уровень"
              :options="spellLevels"
            />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Школа"
            :name="['school']"
            :rules="[ValidationSpell.ruleSchool()]"
          >
            <SelectSchool v-model="form.school" />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Ритуал"
            :name="['time', 'ritual']"
          >
            <ACheckbox v-model:checked="form.ritual"> Возможен </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Концентрация"
            :name="['duration', 'concentration']"
          >
            <ACheckbox v-model:checked="form.concentration">
              Требуется
            </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Вербальный компонент"
            :name="['components', 'v']"
          >
            <ACheckbox v-model:checked="form.components.v">
              Требуется
            </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Соматический компонент"
            :name="['components', 's']"
          >
            <ACheckbox v-model:checked="form.components.s">
              Требуется
            </ACheckbox>
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Материальные компоненты"
          strong
        />
      </ADivider>

      <ARow
        v-for="(component, componentIndex) in form.components.m"
        :key="componentIndex"
        :gutter="16"
      >
        <ACol :span="8">
          <AFormItem
            label="Название"
            :name="['components', 'm', componentIndex, 'name']"
            :rules="[ValidationSpell.ruleMaterialComponentName(component)]"
          >
            <AInput
              v-model:value="component.name"
              placeholder="Введи название"
              allow-clear
            />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Цена"
            :name="['components', 'm', componentIndex, 'price']"
          >
            <AInputNumber
              v-model:value="component.price"
              placeholder="Введи цену"
              allow-clear
              @change="
                typeof $event === 'number' || (component.comparison = undefined)
              "
            />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Тип цены"
            :name="['components', 'm', componentIndex, 'comparison']"
          >
            <SelectComparison
              v-model="component.comparison"
              :disabled="!component.price"
            />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Расходуемый компонент"
            :name="['components', 'm', componentIndex, 'consumable']"
          >
            <ACheckbox
              v-model:checked="component.consumable"
              allow-clear
            >
              Расходуемый
            </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem label="Управление">
            <AFlex :gap="8">
              <AButton
                @click.left.exact.prevent="
                  form.components.m.splice(
                    componentIndex + 1,
                    0,
                    getEmptyMaterialComponent(),
                  )
                "
              >
                Добавить
              </AButton>

              <AButton
                v-if="componentIndex === form.components.m.length - 1"
                :disabled="isEqual(component, getEmptyMaterialComponent())"
                danger
                @click.left.exact.prevent="
                  form.components.m.splice(
                    componentIndex,
                    1,
                    getEmptyMaterialComponent(),
                  )
                "
              >
                Очистить
              </AButton>

              <AButton
                v-else
                danger
                @click.left.exact.prevent="
                  form.components.m.splice(componentIndex, 1)
                "
              >
                Удалить
              </AButton>
            </AFlex>
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Время накладывания"
          strong
        />
      </ADivider>

      <ARow
        v-for="(time, timeIndex) in form.time"
        :key="timeIndex"
        :gutter="16"
      >
        <ACol :span="6">
          <AFormItem
            label="Время накладывания"
            :name="['time', timeIndex, 'value']"
            :rules="[ValidationBase.ruleNumber()]"
          >
            <AInputNumber
              v-model:value="time.value"
              :disabled="!!time.custom"
              :precision="0"
              :min="0"
              placeholder="Введи значение"
              allow-clear
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Тип времени"
            :name="['time', timeIndex, 'type']"
          >
            <SelectTimeType
              v-model="time.type"
              :disabled="!!time.custom"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Собственное значение"
            :name="['time', timeIndex, 'custom']"
          >
            <AInput
              v-model:value="time.custom"
              :disabled="!!time.value || !!time.type"
              placeholder="Введи значение"
              allow-clear
            />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem label="Управление">
            <AFlex :gap="8">
              <AButton
                @click.left.exact.prevent="
                  form.time.splice(timeIndex + 1, 0, getEmptyCastingTime())
                "
              >
                Добавить
              </AButton>

              <AButton
                v-if="timeIndex === form.time.length - 1"
                :disabled="isEqual(time, getEmptyCastingTime())"
                danger
                @click.left.exact.prevent="
                  form.time.splice(timeIndex, 1, getEmptyCastingTime())
                "
              >
                Очистить
              </AButton>

              <AButton
                v-else
                danger
                @click.left.exact.prevent="form.time.splice(timeIndex, 1)"
              >
                Удалить
              </AButton>
            </AFlex>
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Дистанция"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="8">
          <AFormItem
            label="Дистанция"
            :name="['distance', 'value']"
          >
            <AInputNumber
              v-model:value="form.distance.value"
              :disabled="isDefaultDisabled.distance"
              :precision="0"
              :min="0"
              placeholder="Введи значение"
              allow-clear
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Тип дистанции"
            :name="['distance', 'type']"
          >
            <SelectDistanceType
              v-model="form.distance.type"
              :disabled="isDefaultDisabled.distance"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Собственное значение"
            :name="['distance', 'custom']"
          >
            <AInput
              v-model:value="form.distance.custom"
              :disabled="isCustomDisabled.distance"
              placeholder="Введи значение"
              allow-clear
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Длительность"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="8">
          <AFormItem
            label="Длительность"
            :name="['duration', 'value']"
          >
            <AInputNumber
              v-model:value="form.duration.value"
              :disabled="isDefaultDisabled.duration"
              :precision="0"
              :min="0"
              placeholder="Введи значение"
              allow-clear
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Тип длительности"
            :name="['duration', 'type']"
          >
            <SelectDurationType
              v-model="form.duration.type"
              :disabled="isDefaultDisabled.duration"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Собственное значение"
            :name="['duration', 'custom']"
          >
            <AInput
              v-model:value="form.duration.custom"
              :disabled="isCustomDisabled.duration"
              placeholder="Введи значение"
              allow-clear
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Описание"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="12">
          <AFormItem
            label="Описание"
            :name="['description']"
            :rules="[ValidationBase.ruleString()]"
          >
            <ATextarea
              v-model:value="form.description"
              placeholder="Введи описание"
              :rows="8"
            />
          </AFormItem>
        </ACol>

        <ACol :span="12">
          <AFormItem
            label="На более высоких уровнях"
            :name="['upper']"
          >
            <ATextarea
              v-model:value="form.upper"
              placeholder="Введи описание"
              :rows="8"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Принадлежность"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="6">
          <AFormItem
            label="Классы"
            :name="['affiliation', 'classes']"
          >
            <SelectSpecie
              v-model="form.affiliation.classes"
              multiple
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Архетипы"
            :name="['affiliation', 'archetypes']"
          >
            <SelectSpecie
              v-model="form.affiliation.archetypes"
              multiple
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Виды"
            :name="['affiliation', 'species']"
          >
            <SelectSpecie
              v-model="form.affiliation.species"
              multiple
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Происхождения"
            :name="['affiliation', 'origins']"
          >
            <SelectSpecie
              v-model="form.affiliation.origins"
              multiple
            />
          </AFormItem>
        </ACol>
      </ARow>
    </AForm>
  </PageContainer>
</template>
