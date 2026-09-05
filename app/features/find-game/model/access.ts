import type {
  Game,
  GameRegistration,
  GameSession,
  GameViewerAbilities,
  GameViewerRole,
  SessionParticipant,
} from './types';

import { Role } from '~/shared/types';

import { isSessionReviewable } from './utils';

/** Что определяет права текущего пользователя на странице игры. */
export interface GameViewerContext {
  game: Game | null;
  /** UUID пользователя — тот же `sub`, что сервис пишет в `masterId`/`playerId`. */
  userId: string | null;
  roles: ReadonlyArray<string>;
  /**
   * Собственная заявка пользователя в эту игру; `null` — заявки не было.
   * Заявка подаётся один раз на игру, и из неё следует всё остальное:
   * состав, доступ к чатам и возможность отозваться.
   */
  registration: GameRegistration | null;
}

/** Что доступно пользователю в конкретной сессии. */
export interface SessionAbilities {
  /** Сколько игроков входит в состав встречи. */
  participantCount: number;
  /** Сколько мест осталось до `maxPlayers`. */
  freeSlots: number;
  /** Принято максимальное число игроков. */
  isFull: boolean;
  /** Можно отметить присутствие. */
  canChangeAttendance: boolean;
  /** Есть доступ к чату сессии. */
  /** Мастер может назначить дату набору с открытой датой. */
  /** Мастер может завершить сессию. */
  canComplete: boolean;
  /** Мастер может отметить сессию несостоявшейся. */
  canCancel: boolean;
  /** Мастер может перевести сессию в «идёт». */
  canStart: boolean;

  /**
   * Можно оценить участников встречи: она закрыта, окно ещё не вышло, и
   * пользователь в ней участвовал.
   */
  canReview: boolean;
}

/**
 * Определяет роль пользователя относительно игры.
 *
 * Роль считается только по данным сервиса: `masterId` игры и собственная
 * заявка. Догадки по косвенным признакам (например, «есть в
 * `registeredPlayerIds` сессии — значит игрок») сюда не годятся: в том списке
 * только участники встречи, и по нему нельзя отличить ожидающего от
 * отклонённого.
 *
 * @param context Игра, пользователь и его заявка.
 */
export function resolveGameViewerRole(
  context: GameViewerContext,
): GameViewerRole {
  const { game, userId, registration } = context;

  if (!userId) {
    return 'guest';
  }

  if (game && game.masterId === userId) {
    return 'master';
  }

  if (registration?.status === 'APPROVED') {
    return 'player';
  }

  return 'visitor';
}

/**
 * Определяет доступные пользователю действия на странице игры.
 *
 * Каждое право повторяет проверку сервиса: интерфейс не показывает кнопку,
 * которая заведомо получит 403 или 409.
 *
 * @param context Игра, пользователь и его принятые сессии.
 */
export function resolveGameViewerAbilities(
  context: GameViewerContext,
): GameViewerAbilities {
  const { game, userId, roles, registration } = context;

  const role = resolveGameViewerRole(context);
  const isMaster = role === 'master';
  const isApprovedPlayer = registration?.status === 'APPROVED';
  const isSignedIn = !!userId;

  const canModerate =
    roles.includes(Role.ADMIN) || roles.includes(Role.MODERATOR);

  return {
    role,
    isMaster,
    isApprovedPlayer,
    // Править игру может только её владелец — чужую сервис не отдаст.
    canEditGame: isMaster,
    canCreateSession: isMaster,
    canCopySession: isMaster,
    canReviewRegistrations: isMaster,
    // Сервис отвечает 409 на отметку оплаты в бесплатной игре — кнопки там нет.
    canManagePayments: isMaster && game?.costType === 'PAID',
    // Закрыть игру можно один раз: завершением или отменой.
    canCloseGame:
      isMaster && game?.status !== 'CLOSED' && game?.status !== 'CANCELLED',
    canCancelGame:
      isMaster && game?.status !== 'CLOSED' && game?.status !== 'CANCELLED',
    // Набор закрывают, когда мастеру хватает принятых. Совсем пустую игру
    // закрывать нечем: объявление исчезло бы из поиска, ничего не собрав.
    // Полный стол закрыт и так — закрывать его отметкой незачем.
    canCloseRecruitment:
      isMaster
      && !!game
      && !game.recruitmentClosed
      && game.approvedSeats > 0
      && game.takenSeats < game.maxPlayers,
    // Открыть набор снова можно, пока есть свободное место.
    canOpenRecruitment:
      isMaster
      && !!game
      && game.recruitmentClosed
      && game.takenSeats < game.maxPlayers,
    // Поднять можно только открытую публичную игру.
    canRaiseGame:
      isMaster && game?.visibility === 'PUBLIC' && game?.status === 'OPEN',
    canDeleteGame: canModerate,
    // Заявка подаётся один раз на игру: повторную сервис отвергает, а мастер
    // в собственную игру не записывается.
    canApply: isSignedIn && !isMaster && !registration,
    // Отозвать можно только неразобранную: принятое место согласовано, и
    // тихий уход подвёл бы группу.
    canWithdraw: registration?.status === 'PENDING',
    isPending: registration?.status === 'PENDING',
    isRejected: registration?.status === 'REJECTED',
    needsSignIn: !isSignedIn,
  };
}

/**
 * Определяет действия пользователя в конкретной сессии.
 *
 * @param session Сессия игры.
 * @param game Игра, которой принадлежит сессия.
 * @param participant Собственное участие пользователя во встрече, если есть.
 * @param abilities Права пользователя на странице игры.
 */
export function resolveSessionAbilities(
  session: GameSession,
  game: Game | null,
  participant: SessionParticipant | null,
  abilities: GameViewerAbilities,
): SessionAbilities {
  const participantCount = session.registeredPlayerIds.length;
  const maxPlayers = game?.maxPlayers ?? 0;
  const freeSlots = Math.max(0, maxPlayers - participantCount);
  // Участие заводится принятием заявки в игру: его наличие и есть состав.
  const isParticipant = !!participant;

  // Закрыть сессию можно один раз: завершением или отменой.
  const isSessionClosed =
    session.status === 'COMPLETED' || session.status === 'CANCELLED';

  return {
    participantCount,
    freeSlots,
    isFull: maxPlayers > 0 && participantCount >= maxPlayers,
    canChangeAttendance:
      isParticipant
      && session.status !== 'COMPLETED'
      && session.status !== 'CANCELLED',
    canComplete: abilities.isMaster && !isSessionClosed,
    canCancel: abilities.isMaster && !isSessionClosed,
    canStart: abilities.isMaster && session.status === 'SCHEDULED',
    // Мастеру пустой стол оценивать некого, игроку — оценивать нечего, если
    // его во встрече не было.
    canReview:
      isSessionReviewable(session)
      && (abilities.isMaster ? participantCount > 0 : isParticipant),
  };
}
