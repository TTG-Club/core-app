const STROKE_WIDTH_REGEX = /stroke-width="[^"]*"/g;

export default defineAppConfig({
  icon: {
    mode: 'css',
    cssLayer: 'base',
    customize: (content: string) =>
      content.replace(STROKE_WIDTH_REGEX, 'stroke-width="1.5"'),
  },
  ui: {
    icons: {
      arrowDown: 'tabler:arrow-down',
      arrowLeft: 'tabler:arrow-left',
      arrowRight: 'tabler:arrow-right',
      arrowUp: 'tabler:arrow-up',
      caution: 'tabler:alert-hexagon',
      check: 'tabler:check',
      chevronDoubleLeft: 'tabler:chevrons-left',
      chevronDoubleRight: 'tabler:chevrons-right',
      chevronDown: 'tabler:chevron-down',
      chevronLeft: 'tabler:chevron-left',
      chevronRight: 'tabler:chevron-right',
      chevronUp: 'tabler:chevron-up',
      close: 'tabler:x',
      copy: 'tabler:copy',
      copyCheck: 'tabler:circle-check',
      dark: 'tabler:moon',
      drag: 'tabler:grip-vertical',
      ellipsis: 'tabler:dots',
      error: 'tabler:alert-triangle',
      external: 'tabler:external-link',
      eye: 'tabler:eye',
      eyeOff: 'tabler:eye-off',
      file: 'tabler:file',
      folder: 'tabler:folder',
      folderOpen: 'tabler:folder-open',
      hash: 'tabler:hash',
      info: 'tabler:info-circle',
      light: 'tabler:sun',
      loading: 'tabler:loader-2',
      menu: 'tabler:menu-2',
      minus: 'tabler:minus',
      panelClose: 'tabler:layout-sidebar-left-collapse',
      panelOpen: 'tabler:layout-sidebar-left-expand',
      plus: 'tabler:plus',
      reload: 'tabler:refresh',
      search: 'tabler:search',
      stop: 'tabler:player-stop',
      success: 'tabler:circle-check',
      system: 'tabler:device-desktop',
      tip: 'tabler:bulb',
      upload: 'tabler:upload',
      warning: 'tabler:alert-octagon',
    },
    link: {
      base: 'text-link',
      variants: {
        active: {
          false: 'text-link',
          true: 'text-link',
        },
      },
      compoundVariants: [
        {
          active: false,
          disabled: false,
          class: [
            'text-link',
            'hover:text-link',
            'hover:underline',
            'active:brightness-80',
            'transition-[filter]',
          ],
        },
      ],
    },
    buttonGroup: {
      variants: {
        orientation: {
          horizontal: 'w-full',
        },
      },
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'solid',
          class: 'text-secondary',
        },
      ],
    },
    formField: {
      slots: {
        help: 'text-xs text-secondary',
        description: 'text-xs text-secondary',
      },
    },
    checkbox: {
      slots: {
        wrapper: 'w-auto',
        label: 'cursor-pointer',
      },
    },
    input: {
      slots: {
        root: 'w-full',
        base: 'bg-accented',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    inputDate: {
      slots: {
        base: 'w-full bg-accented',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    inputTags: {
      slots: {
        root: 'w-full',
        base: 'bg-accented',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    inputNumber: {
      slots: {
        root: 'w-full',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    textarea: {
      slots: {
        root: 'w-full',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    select: {
      slots: {
        base: 'w-full',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    selectMenu: {
      slots: {
        base: 'w-full',
      },
      variants: {
        defaultVariants: {
          variant: 'soft',
        },
        variant: {
          outline: 'bg-accented text-default',
        },
      },
    },
    popover: {
      slots: {
        content: [
          'max-w-(--reka-popover-content-available-width) md:max-w-md h-auto',
          'flex flex-col gap-2 py-2 px-4',
          'text-xs text-highlighted',
        ],
      },
    },
    tooltip: {
      slots: {
        content: [
          'max-w-(--reka-tooltip-content-available-width) md:max-w-md h-auto',
          'flex flex-col gap-2',
        ],
        text: 'whitespace-normal',
      },
    },
    drawer: {
      slots: {
        content: 'w-2xl overflow-hidden max-md:rounded-none',
        container: 'gap-0 p-0',
        header: 'bg-default sticky top-0 p-4 z-1',
        body: 'px-4 pb-4',
        overlay: 'bg-elevated/45 cursor-pointer',
        handle: 'cursor-grab active:cursor-grabbing',
      },
    },
    dropdownMenu: {
      slots: {
        item: 'cursor-pointer',
      },
    },
    collapsible: {
      slots: {
        root: ['flex flex-col gap-2 rounded'],
      },
    },
    carousel: {
      slots: {
        root: 'border-none',
        dot: 'w-6 h-1',
      },
    },
    separator: {
      slots: {
        root: 'col-span-full',
      },
    },
    toast: {
      variants: {
        color: {
          primary: {
            title: 'font-bold text-highlighted',
          },
          secondary: {
            title: 'font-bold text-highlighted',
          },
          success: {
            title: 'font-bold text-highlighted',
          },
          info: {
            title: 'font-bold text-highlighted',
          },
          warning: {
            title: 'font-bold text-highlighted',
          },
          error: {
            title: 'font-bold text-highlighted',
          },
          neutral: {
            title: 'font-bold text-highlighted',
          },
        },
      },
    },
    tabs: {
      slots: {
        trigger: 'cursor-pointer',
      },
    },
  },
});
