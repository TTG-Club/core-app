<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { BeastEditor } from '~bestiary/editor';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { BeastCreate } from '~bestiary/types';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof BeastEditor>>('editor');

  const form = useState<BeastCreate>(getInitialState);
  const backup = useState<BeastCreate>(getInitialState);

  const { status } = await useAsyncData(
    `bestiary-${route.params.url}-raw`,
    () =>
      $fetch<BeastCreate>(`/api/v2/bestiary/${route.params.url}/raw`, {
        onResponse: (ctx) => {
          const initialState = getInitialState();

          merge(initialState, ctx.response._data);

          form.value = cloneDeep(initialState);
          backup.value = cloneDeep(initialState);
        },
      }),
    { server: false },
  );

  const rawIncorrect = computed(
    () => status.value === 'error' || !backup.value,
  );

  const isCreating = ref(false);
  const isCreated = ref(false);

  async function submit() {
    if (!checkIsEdited()) {
      $toast.error({
        title: 'Ошибка сохранения магического предмета',
        description: 'Измени хотя бы одно поле, чтобы сохранить',
      });

      throw new Error('Form is equal with initial state');
    }

    if (!editor.value?.validate) {
      $toast.error({
        title: 'Ошибка сохранения магического предмета',
        description: () =>
          h('span', null, [
            'Произошла какая-то ошибка... попробуй еще раз или обратись за помощью на нашем ',
            h(
              'a',
              {
                target: '_blank',
                href: 'https://discord.gg/JqFKMKRtxv',
                rel: 'noreferrer noopener',
              },
              'Discord-канале',
            ),
          ]),
      });

      throw new Error('Validation method was not found');
    }

    isCreating.value = true;

    try {
      const payload = await editor.value.validate();

      await $fetch<string>(`/api/v2/bestiary/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка сохранения существа',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: 'Существо успешно сохранено',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-backgrounds' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  }

  function getInitialState(): BeastCreate {
    return {
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
      type: {
        type: [], // типы существа
        text: undefined,
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
          text: undefined,
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
        str: {
          ability: 'STRENGTH',
          value: 10,
          save: false,
          mod: undefined,
        },
        dex: { ability: 'DEXTERITY', value: 10, save: false, mod: undefined },
        con: {
          ability: 'CONSTITUTION',
          value: 10,
          save: false,
          mod: undefined,
        },
        int: {
          ability: 'INTELLIGENCE',
          value: 10,
          save: false,
          mod: undefined,
        },
        wis: { ability: 'WISDOM', value: 10, save: false, mod: undefined },
        chr: { ability: 'CHARISMA', value: 10, save: false, mod: undefined },
      },
      skills: [],
      vulnerabilities: [],
      resistance: [],
      immunityToDamage: [],
      immunityToCondition: [],
      equipments: [],
      senses: {
        senses: [
          {
            type: '',
            value: 0,
          },
        ],
        passivePerception: 10,
      },
      languages: {
        languages: [],
        text: undefined,
        telepathy: undefined,
      },
      proficiencyBonus: 2,
      experience: {
        value: 0,
        inLair: undefined,
        suffix: undefined,
      },
      traits: [],
      actions: [],
      bonusActions: [],
      reactions: [],
      legendaryActions: [],
      image: undefined,
      tags: [],
    };
  }

  function checkIsEdited() {
    return !isEqual(toRaw(backup.value), toRaw(form.value));
  }

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
      <PageHeader title="Редактирование существа">
        <template #actions>
          <AButton
            type="primary"
            :disabled="isCreated"
            :loading="editor?.isCreating"
            @click.left.exact.prevent="submit"
          >
            <template #icon>
              <SvgIcon icon="check" />
            </template>

            <template #default> Сохранить </template>
          </AButton>

          <ATooltip
            title="Закрыть"
            :mouse-enter-delay="0.7"
            destroy-tooltip-on-hide
          >
            <AButton
              type="text"
              @click.left.exact.prevent="navigateTo('/magic-items')"
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
        <AResult
          v-if="rawIncorrect"
          status="error"
          title="Некорректные данные"
          sub-title="Не найдено существо для редактирования"
        />

        <BeastEditor
          v-else
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
