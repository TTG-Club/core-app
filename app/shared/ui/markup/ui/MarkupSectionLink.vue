<script setup lang="ts">
  import type { DefineComponent, VNode } from 'vue';

  import type { MarkerType } from '../config';
  import type { MarkerNode, RenderNode } from '../types';

  import { computed, shallowRef, watch } from 'vue';

  import { ULink } from '#components';
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { CreatureDrawer } from '~bestiary/drawer';
  import { ClassDrawer } from '~classes/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { GlossaryDrawer } from '~glossary/drawer';
  import { ItemDrawer } from '~items/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SpeciesDrawer } from '~species/drawer';
  import { SpellDrawer } from '~spells/drawer';

  import { SECTION_LINK_PLAIN_TEXT_WARNING } from '../consts';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Тип только для секционных ссылок из MarkerType
  type SectionLinkType = Extract<
    MarkerType,
    | 'class'
    | 'species'
    | 'spell'
    | 'feat'
    | 'background'
    | 'magicItem'
    | 'item'
    | 'creature'
    | 'glossary'
  >;

  // Тип для компонента drawer
  type DrawerComponent = DefineComponent<{
    url: string;
    onClose: () => void;
  }>;

  // Маппинг URL путей - все ключи обязательны
  const MARKER_URL_MAP: Record<SectionLinkType, string> = {
    class: 'classes',
    species: 'species',
    spell: 'spells',
    feat: 'feats',
    background: 'backgrounds',
    magicItem: 'magic-items',
    item: 'items',
    creature: 'bestiary',
    glossary: 'glossary',
  } as const;

  // Маппинг компонентов - все ключи обязательны
  const DRAWER_COMPONENT_MAP: Record<SectionLinkType, DrawerComponent> = {
    class: ClassDrawer,
    species: SpeciesDrawer,
    background: BackgroundDrawer,
    creature: CreatureDrawer,
    feat: FeatDrawer,
    glossary: GlossaryDrawer,
    magicItem: MagicItemDrawer,
    item: ItemDrawer,
    spell: SpellDrawer,
  } as const;

  // Type guard с использованием ключей из маппинга
  function isSectionLinkType(type: string): type is SectionLinkType {
    return type in DRAWER_COMPONENT_MAP;
  }

  // Узел читаем только внутри computed: компонент переиспользуется под другое
  // описание (панель выбора варианта в листе меняет описание на месте, а ключи
  // в MarkupRender порядковые), и снимок при создании оставлял ссылке адрес
  // прежнего описания при новом тексте.
  const url = computed(() => node.attrs?.url?.toString() ?? '');

  const sectionType = computed(() =>
    isSectionLinkType(node.type) ? node.type : null,
  );

  const to = computed(() =>
    sectionType.value && url.value
      ? `/${MARKER_URL_MAP[sectionType.value]}/${url.value}`
      : '',
  );

  const overlay = useOverlay();

  /**
   * Дровер раздела под адрес ссылки.
   *
   * @param component дровер того раздела, на который ведёт ссылка.
   * @param drawerUrl адрес страницы раздела.
   * @returns управление созданным дровером.
   */
  function createDrawer(component: DrawerComponent, drawerUrl: string) {
    // Решение циклической зависимости через let и колбэк
    const sectionDrawer: ReturnType<typeof overlay.create<DrawerComponent>> =
      overlay.create(component, {
        props: {
          url: drawerUrl,
          onClose: () => {
            sectionDrawer.close();
          },
        },
        destroyOnClose: true,
      });

    return sectionDrawer;
  }

  /** Дровер ссылки и путь страницы, под который он заведён. */
  interface LinkDrawer {
    path: string;
    sectionDrawer: ReturnType<typeof createDrawer>;
  }

  /**
   * Дровер заводится по клику, а не при создании компонента: адрес ссылки
   * может смениться, и открываться должно то, куда ссылка ведёт сейчас.
   */
  const linkDrawer = shallowRef<LinkDrawer | null>(null);

  /**
   * Ссылка без адреса раздела (её легко написать руками: `{@spell Огненный
   * шар}` без `|url:`) или с незнакомым типом рисуется обычным текстом. Бросать
   * тут нельзя: компонент разворачивается ВНЕ try/catch `MarkupRender`, и
   * ошибка обрывает отрисовку целого описания, а не одной ссылки — блок с
   * разметкой просто не появляется на экране. Так же рассуждает MarkupHeading
   * про неверный `level:`.
   */
  watch(
    to,
    (linkPath) => {
      if (!linkPath) {
        consola.warn(SECTION_LINK_PLAIN_TEXT_WARNING, JSON.stringify(node));
      }
    },
    { immediate: true },
  );

  const isOpened = computed(() =>
    linkDrawer.value
      ? overlay.isOpen(linkDrawer.value.sectionDrawer.id)
      : false,
  );

  /**
   * Открывает дровер раздела по текущему адресу ссылки. Дровер, заведённый под
   * другой путь, заменяется новым.
   */
  function handleClick() {
    const linkType = sectionType.value;

    if (!linkType || !url.value) {
      return;
    }

    if (linkDrawer.value?.path !== to.value) {
      // Прежний дровер ведёт на старый адрес. Закрытый дровер сам с учёта
      // оверлеев не снимается, поэтому снимаем его, а не копим
      if (linkDrawer.value) {
        overlay.unmount(linkDrawer.value.sectionDrawer.id);
      }

      linkDrawer.value = {
        path: to.value,
        sectionDrawer: createDrawer(DRAWER_COMPONENT_MAP[linkType], url.value),
      };
    }

    linkDrawer.value.sectionDrawer.open();
  }

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <ULink
    v-if="to"
    :to="to"
    target="_self"
    :is-opened="isOpened"
    @click.left.exact.prevent.stop="handleClick"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </ULink>

  <template v-else>
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </template>
</template>
