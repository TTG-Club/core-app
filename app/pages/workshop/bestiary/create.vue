<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { BeastEditor } from '~bestiary/editor';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { BeastCreate } from '~bestiary/types';

  const $toast = useToast();

  const editor = useTemplateRef<InstanceType<typeof BeastEditor>>('editor');

  const form = ref<BeastCreate>({
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
    image: undefined,
    tags: [],
    type: {
      type: [], // типы существа
      text: undefined, // уточнение типа
    },
    size: {
      size: undefined,
      text: undefined,
      sizeString: undefined,
    },
    alignment: undefined, // мировоззрение
    ac: '', // класс доспеха
    initiative: 0, // инициатива
    hit: {
      hit: 0, // среднее количество хитов или абсолютное значение
      formula: '',
      countHitDice: undefined, // количество костей хитов
      text: undefined, // текстовое описание хитов
    },
    speed: {
      walk: {
        value: 30,
        text: '',
      },
      burrow: {
        value: 0,
        text: undefined,
      },
      fly: {
        value: 0,
        text: undefined,
        hover: false,
      },
      swim: {
        value: 0,
        text: undefined,
      },
      climb: {
        value: 0,
        text: undefined,
      },
      text: undefined,
    },
    abilities: {
      str: { ability: 'STRENGTH', value: 10, save: false, mod: undefined },
      dex: { ability: 'DEXTERITY', value: 10, save: false, mod: undefined },
      con: { ability: 'CONSTITUTION', value: 10, save: false, mod: undefined },
      int: { ability: 'INTELLIGENCE', value: 10, save: false, mod: undefined },
      wis: { ability: 'WISDOM', value: 10, save: false, mod: undefined },
      chr: { ability: 'CHARISMA', value: 10, save: false, mod: undefined },
    },
    skills: [],
    vulnerabilities: [],
    resistance: [],
    immunityToDamage: [],
    immunityToCondition: [],
    equipments: [],
    languages: {
      languages: [],
      text: undefined,
      telepathy: undefined,
    },
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    legendaryActions: [],
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/bestiary', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка создания существа',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: 'Существо успешно создано',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-magic-items' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  };

  function getLink() {
    return h('span', [
      'Можешь перейти на него ',
      h(
        NuxtLink,
        {
          to: {
            name: 'bestiary-url',
            params: {
              url: form.value.url,
            },
          },
          target: '_blank',
        },
        () => 'страницу',
      ),
    ]);
  }
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Создание нового существа">
        <template #actions>
          <AButton
            type="primary"
            :disabled="isCreated"
            :loading="isCreating"
            @click.left.exact.prevent="submit"
          >
            <template #icon>
              <SvgIcon icon="check" />
            </template>

            <template #default> Создать </template>
          </AButton>

          <ATooltip
            title="Закрыть"
            :mouse-enter-delay="0.7"
            destroy-tooltip-on-hide
          >
            <AButton
              type="text"
              @click.left.exact.prevent="navigateTo('/workshop/bestiary')"
            >
              <template #icon>
                <SvgIcon icon="close" />
              </template>
            </AButton>
          </ATooltip>
        </template>
      </PageHeader>
    </template>

    <template #default>
      <ClientOnly>
        <BeastEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
