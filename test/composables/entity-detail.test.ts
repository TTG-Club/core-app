import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import { useEntityDetail } from '~/composables/useEntityDetail';

/** Запись раздела для тестов: о ней известен только адрес. */
interface Entry {
  address: string;
}

/**
 * Загрузка, ответ которой отдаётся вручную: так проверяется порядок
 * ответов, отличный от порядка запросов.
 */
function createManualLoad() {
  const requests = new Map<
    string,
    { resolve: (entry: Entry) => void; reject: (error: Error) => void }
  >();

  /**
   * Запрашивает запись; ответ придёт, когда его отдадут вручную.
   * @param address - адрес записи
   */
  function load(address: string): Promise<Entry> {
    return new Promise<Entry>((resolve, reject) => {
      requests.set(address, { resolve, reject });
    });
  }

  /**
   * Отдаёт ответ на запрос записи.
   * @param address - адрес записи
   */
  async function respond(address: string): Promise<void> {
    requests.get(address)?.resolve({ address });
    await nextTick();
  }

  /**
   * Срывает запрос записи.
   * @param address - адрес записи
   */
  async function fail(address: string): Promise<void> {
    requests.get(address)?.reject(new Error('Сервер недоступен'));
    await nextTick();
  }

  return { load, respond, fail, requests };
}

describe('useEntityDetail', () => {
  it('грузит запись по адресу', async () => {
    const { load, respond } = createManualLoad();
    const { data, status } = useEntityDetail(() => '/spells/a', load);

    expect(status.value).toBe('pending');
    expect(data.value).toBeUndefined();

    await respond('/spells/a');

    expect(status.value).toBe('success');
    expect(data.value).toEqual({ address: '/spells/a' });
  });

  it('при смене адреса прежняя запись сразу убирается', async () => {
    const { load, respond } = createManualLoad();
    const address = ref('/spells/a');
    const { data, status } = useEntityDetail(address, load);

    await respond('/spells/a');

    address.value = '/spells/b';
    await nextTick();

    expect(data.value).toBeUndefined();
    expect(status.value).toBe('pending');

    await respond('/spells/b');

    expect(data.value).toEqual({ address: '/spells/b' });
  });

  it('запоздавший ответ прежнего адреса не подменяет текущую запись', async () => {
    const { load, respond } = createManualLoad();
    const address = ref('/spells/a');
    const { data, status } = useEntityDetail(address, load);

    address.value = '/spells/b';
    await nextTick();

    // Ответы приходят не в том порядке, в каком ушли запросы
    await respond('/spells/b');
    await respond('/spells/a');

    expect(data.value).toEqual({ address: '/spells/b' });
    expect(status.value).toBe('success');
  });

  it('сбой прежнего адреса не портит состояние текущего', async () => {
    const { load, respond, fail } = createManualLoad();
    const address = ref('/spells/a');
    const { data, status } = useEntityDetail(address, load);

    address.value = '/spells/b';
    await nextTick();

    await fail('/spells/a');

    expect(status.value).toBe('pending');

    await respond('/spells/b');

    expect(data.value).toEqual({ address: '/spells/b' });
  });

  it('сбой текущего адреса виден как ошибка', async () => {
    const { load, fail } = createManualLoad();
    const { data, status } = useEntityDetail(() => '/spells/a', load);

    await fail('/spells/a');

    expect(status.value).toBe('error');
    expect(data.value).toBeUndefined();
  });

  it('без адреса ничего не грузит', () => {
    const { load, requests } = createManualLoad();
    const { status } = useEntityDetail(() => '', load);

    expect(status.value).toBe('idle');
    expect(requests.size).toBe(0);
  });
});
