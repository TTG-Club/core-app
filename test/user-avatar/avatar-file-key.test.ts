import { describe, expect, it } from 'vitest';

import {
  getOwnAvatarFileKey,
  getUserAvatarFolderKey,
} from '#server/domain/user-avatar/utils';

const USER_ID = '3f6c2a4e-8d1b-4c7e-9a0f-2b5d6e7f8a90';
const OTHER_USER_ID = '9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d';

describe('ключ файла своей аватарки', () => {
  it('папка аватарок собирается из раздела и идентификатора', () => {
    expect(getUserAvatarFolderKey(USER_ID)).toBe(`avatars/${USER_ID}/`);
  });

  it('файл прямо в своей папке отдаёт ключ без префикса хранилища', () => {
    expect(
      getOwnAvatarFileKey(
        `/s3/avatars/${USER_ID}/1757851200000-avatar.webp`,
        USER_ID,
      ),
    ).toBe(`avatars/${USER_ID}/1757851200000-avatar.webp`);
  });

  it('без аватарки удалять нечего', () => {
    expect(getOwnAvatarFileKey(null, USER_ID)).toBeNull();
  });

  it('файл из папки другого пользователя не отдаётся', () => {
    expect(
      getOwnAvatarFileKey(`/s3/avatars/${OTHER_USER_ID}/a.webp`, USER_ID),
    ).toBeNull();
  });

  it('файлы других разделов и сторонние адреса не отдаются', () => {
    expect(
      getOwnAvatarFileKey(`/s3/sheet-avatar/${USER_ID}/a.webp`, USER_ID),
    ).toBeNull();

    expect(
      getOwnAvatarFileKey(
        `https://evil.example/s3/avatars/${USER_ID}/a.webp`,
        USER_ID,
      ),
    ).toBeNull();
  });

  it('вложенный путь и пустое имя файла не считаются аватаркой', () => {
    expect(
      getOwnAvatarFileKey(`/s3/avatars/${USER_ID}/nested/a.webp`, USER_ID),
    ).toBeNull();

    expect(getOwnAvatarFileKey(`/s3/avatars/${USER_ID}/`, USER_ID)).toBeNull();
  });

  it('идентификатор сверяется в том виде, в каком лёг в ключ', () => {
    // Ключ при загрузке собирается слагом, а он приводит буквы к нижнему регистру.
    expect(
      getOwnAvatarFileKey(
        `/s3/avatars/${USER_ID}/a.webp`,
        USER_ID.toUpperCase(),
      ),
    ).toBe(`avatars/${USER_ID}/a.webp`);
  });
});
