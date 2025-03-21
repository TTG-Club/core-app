import type { VNode } from 'vue';

export type ToastTypes = 'info' | 'success' | 'warning' | 'error';

export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface ToastConfig {
  title: string | (() => string | VNode);
  description?: string | (() => string | VNode | undefined);
  icon?: string | (() => string | undefined);
  hideCloseButton?: boolean;
  duration?: number | null | false;
  buttons?: () => Array<VNode> | VNode | undefined;
  type?: ToastTypes | (() => ToastTypes | undefined);
  position?: ToastPosition;
  mounted?: (id: string) => Promise<void> | void;
  beforeClose?: (id: string) => Promise<void> | void;
  afterClose?: (id: string) => Promise<void> | void;
}

export interface ToastProps {
  id: string;
  title: string | VNode;
  description?: string | VNode | undefined;
  icon?: string | undefined;
  hideCloseButton?: boolean;
  duration?: number | null | false;
  buttons?: Array<VNode>;
  type?: ToastTypes | undefined;
  position?: ToastPosition;
  mounted?: (id: string) => Promise<void> | void;
  beforeClose?: (id: string) => Promise<void> | void;
  afterClose?: (id: string) => Promise<void> | void;
  close: () => Promise<void>;
}

export interface ToastControls {
  id: ToastProps['id'];
  close: ToastProps['close'];
}

export type ToastConfigTyped = Omit<ToastConfig, 'type'>;
