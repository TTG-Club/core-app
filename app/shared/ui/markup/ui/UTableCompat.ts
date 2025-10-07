import { defineComponent, h, type PropType } from 'vue';
import { UTable } from '#components';

export default defineComponent({
  name: 'UTableCompat',
  props: {
    data: { type: Array as PropType<any[]>, required: true },
    columns: { type: Array as PropType<any[]>, required: true },
    ui: { type: Object as PropType<Record<string, any>>, required: false },
  },
  setup(props, { slots }) {
    return () => h(UTable as unknown as any, props, slots);
  },
});
