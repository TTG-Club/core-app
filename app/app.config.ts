export default defineAppConfig({
  icon: {
    customize: (content: string) =>
      content
        .replace(/fill="(?!none|currentColor)[^"]*"/g, 'fill="currentColor"')
        .replace(
          /stroke="(?!none|currentColor)[^"]*"/g,
          'stroke="currentColor"',
        )
        .replace(/stroke-width="[^"]*"/g, 'stroke-width="1.5"'),
  },
  ui: {
    icons: {
      arrowDown: 'i-tabler-arrow-down',
      arrowLeft: 'i-tabler-arrow-left',
      arrowRight: 'i-tabler-arrow-right',
      arrowUp: 'i-tabler-arrow-up',
      caution: 'i-tabler-alert-triangle',
      check: 'i-ttg-check',
      chevronDoubleLeft: 'i-tabler-chevrons-left',
      chevronDoubleRight: 'i-tabler-chevrons-right',
      chevronDown: 'i-tabler-chevron-down',
      chevronLeft: 'i-tabler-chevron-left',
      chevronRight: 'i-tabler-chevron-right',
      chevronUp: 'i-tabler-chevron-up',
      close: 'i-ttg-x',
      copy: 'i-tabler-copy',
      copyCheck: 'i-tabler-circle-check',
      dark: 'i-tabler-moon',
      drag: 'i-tabler-grip-vertical',
      ellipsis: 'i-tabler-dots',
      error: 'i-tabler-circle-x',
      external: 'i-tabler-external-link',
      eye: 'i-tabler-eye',
      eyeOff: 'i-tabler-eye-off',
      file: 'i-tabler-file',
      folder: 'i-tabler-folder',
      folderOpen: 'i-tabler-folder-open',
      hash: 'i-tabler-hash',
      info: 'i-tabler-info-circle',
      light: 'i-tabler-sun',
      loading: 'i-tabler-loader-2',
      menu: 'i-tabler-menu-2',
      minus: 'i-ttg-minus',
      panelClose: 'i-tabler-layout-sidebar-left-collapse',
      panelOpen: 'i-tabler-layout-sidebar-left-expand',
      plus: 'i-ttg-plus',
      reload: 'i-tabler-refresh',
      search: 'i-ttg-search',
      stop: 'i-tabler-player-stop',
      success: 'i-tabler-circle-check',
      system: 'i-tabler-device-desktop',
      tip: 'i-tabler-bulb',
      upload: 'i-tabler-upload',
      warning: 'i-tabler-alert-triangle',
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
