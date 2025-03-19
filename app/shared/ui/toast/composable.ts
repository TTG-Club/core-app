import { v7 as uuid } from 'uuid';

import { useToastState } from './state';

import type {
  ToastConfig,
  ToastConfigTyped,
  ToastControls,
  ToastTypes,
} from './types';
import { isString } from 'lodash-es';
import { createTextVNode } from 'vue';

const BASE_CONFIG: Omit<
  ToastConfig,
  'title' | 'description' | 'actions' | 'icon'
> = {
  position: 'top-right',
  duration: 5000,
  hideCloseButton: false,
};

export function useToast() {
  const { state } = useToastState();

  function open(config: ToastConfig): ToastControls {
    const id = uuid();

    const title = getTitle(config.title);
    const description = getDescription(config.description);
    const buttons = getButtons(config.buttons);
    const type = getType(config.type);
    const icon = getIcon(config.icon, type);

    state.value.set(id, {
      ...BASE_CONFIG,
      ...config,
      id,
      title,
      description,
      buttons,
      type,
      icon,
      close: () => close(id),
    });

    return {
      id,
      close: () => close(id),
    };
  }

  async function close(id: string): Promise<void> {
    const toast = state.value.get(id);

    if (!toast) {
      throw new Error('[Toast]: Такого уведомления не существует');
    }

    await toast.beforeClose?.(id);

    state.value.delete(id);

    await toast.afterClose?.(id);
  }

  function info(config: ToastConfigTyped): ToastControls {
    return open({
      ...config,
      type: 'info',
    });
  }

  function success(config: ToastConfigTyped): ToastControls {
    return open({
      ...config,
      type: 'success',
    });
  }

  function warning(config: ToastConfigTyped): ToastControls {
    return open({
      ...config,
      type: 'warning',
    });
  }

  function error(config: ToastConfigTyped): ToastControls {
    return open({
      ...config,
      type: 'error',
    });
  }

  function closeAll(): void {
    state.value.clear();
  }

  function getType(prop: ToastConfig['type']): ToastTypes | undefined {
    if (!prop) {
      return undefined;
    }

    return toValue(prop);
  }

  function getIcon(
    prop: ToastConfig['icon'],
    type: ToastTypes | undefined,
  ): string | undefined {
    return toValue(prop) || type;
  }

  function getTitle(prop: ToastConfig['title']): string | VNode {
    const title = toValue(prop);

    return isString(title) ? createTextVNode(title) : title;
  }

  function getDescription(
    prop: ToastConfig['description'],
  ): string | VNode | undefined {
    const desc = toValue(prop);

    if (!desc) {
      return undefined;
    }

    return isString(desc) ? createTextVNode(desc) : desc;
  }

  function getButtons(prop: ToastConfig['buttons']): VNode[] {
    const buttons = toValue(prop);

    if (!buttons) {
      return [];
    }

    return Array.isArray(buttons) ? buttons : [buttons];
  }

  return {
    open,
    close,
    info,
    success,
    warning,
    error,
    closeAll,
  };
}
