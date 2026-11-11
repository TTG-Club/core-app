import { describe, expect, it } from 'vitest';

import { parseAdminUsersTotal } from '~admin/users/model';

/** Сколько пользователей возвращает ручка в тесте */
const USERS_TOTAL = 1234;

describe('parseAdminUsersTotal', () => {
  it('берёт общее число пользователей из страницы списка', () => {
    expect(
      parseAdminUsersTotal({
        content: [],
        size: 1,
        totalElements: USERS_TOTAL,
      }),
    ).toBe(USERS_TOTAL);
  });

  it('не принимает ответ без общего числа', () => {
    expect(() => parseAdminUsersTotal({ content: [] })).toThrow();
  });
});
