import { describe, expect, it } from 'vitest';

import { getS3OwnerFolder, isTeamS3Section } from '#server/domain/s3/utils/s3';
import { BUG_REPORT_REPLY_IMAGE_SECTION, S3_TEAM_FOLDER } from '#shared/consts';

/** Обычный раздел хранилища: файлы лежат в папках загрузивших. */
const PERSONAL_SECTION = 'articles';

/** Логин модератора, которого адрес картинки не должен выдавать. */
const MODERATOR_USERNAME = 'moderator';

describe('папка картинок в ответе на баг-репорт', () => {
  it('раздел ответов — командный, обычные разделы — нет', () => {
    expect(isTeamS3Section(BUG_REPORT_REPLY_IMAGE_SECTION)).toBe(true);
    expect(isTeamS3Section(PERSONAL_SECTION)).toBe(false);
    expect(isTeamS3Section(undefined)).toBe(false);
  });

  it('файл ответа ложится в общую папку, без логина модератора', () => {
    expect(
      getS3OwnerFolder(BUG_REPORT_REPLY_IMAGE_SECTION, MODERATOR_USERNAME),
    ).toBe(S3_TEAM_FOLDER);
  });

  it('в обычном разделе файл остаётся в папке загрузившего', () => {
    expect(getS3OwnerFolder(PERSONAL_SECTION, MODERATOR_USERNAME)).toBe(
      MODERATOR_USERNAME,
    );
  });
});
