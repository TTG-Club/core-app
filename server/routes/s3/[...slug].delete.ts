import { StatusCodes } from 'http-status-codes';

import { isPrivateS3Key, isTeamS3Section, S3Service } from '#server/domain/s3';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  if (isPrivateS3Key(slug)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  const [section, username] = slug.split('/');

  // Файлы командного раздела лежат в общей папке, а не в папке пользователя:
  // проверка «это мой файл» к ним неприменима — пользователь с логином,
  // совпавшим с именем папки, не должен получить к ним доступ.
  if (isTeamS3Section(section)) {
    assertAdminAccess(await getUserFromToken(event));
  } else if (!(await isUserHasAccess(event, username))) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  return S3Service.delete(slug);
});
