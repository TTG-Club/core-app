import { AVATAR_FRAME_IMAGE_URL } from '../model';
import { useMyRewards } from './useMyRewards';
import { useMySubscriptions } from './useMySubscriptions';

/**
 * Косметические бейджи текущего пользователя для хелмета: активная подписка
 * (корона) и рамка аватара (перк AVATAR_FRAME).
 *
 * Помимо чтения флагов, инстанс composable «прогревает» данные к моменту показа:
 * useMyRewards/useMySubscriptions грузятся на клиенте (server: false) по общему
 * ключу useAsyncData, а картинка рамки подкачивается в HTTP-кэш через new Image().
 * Поэтому вызов заранее (в хелмете, до открытия панели) убирает «доезд» бейджа и
 * рамки уже в открытом поповере — его контент монтируется лениво при открытии.
 */
export function useProfileBadges() {
  const { perks, status: rewardsStatus } = useMyRewards();
  const { subscriptions, status: subscriptionsStatus } = useMySubscriptions();

  // «Залипающие» флаги: пересчитываем только на успешной загрузке. Ошибочный
  // фоновый опрос сбрасывает data в [] (см. useAsyncData), и без залипания корона
  // и рамка мигали бы, пока панель открыта, до следующего успешного опроса.
  // На успехе значение обновляется честно (в т.ч. в false, если подписка истекла).
  const isSubscriptionActive = ref(false);
  const hasAvatarFrame = ref(false);

  watch(
    [subscriptionsStatus, subscriptions],
    ([status, subs]) => {
      if (status === 'success') {
        isSubscriptionActive.value = (subs ?? []).some(
          (sub) => sub.status === 'ACTIVE',
        );
      }
    },
    { immediate: true },
  );

  watch(
    [rewardsStatus, perks],
    ([status, perkSet]) => {
      if (status === 'success') {
        hasAvatarFrame.value = perkSet.has('AVATAR_FRAME');
      }
    },
    { immediate: true },
  );

  // Прайм картинки рамки в HTTP-кэш заранее, чтобы <img> в панели не «доезжал»
  // при открытии. new Image() (а не <link rel=preload>) — без предупреждения о
  // неиспользованном preload, если панель так и не открыли.
  if (import.meta.client) {
    watch(
      hasAvatarFrame,
      (has) => {
        if (has) {
          const img = new Image();

          img.src = AVATAR_FRAME_IMAGE_URL;
        }
      },
      { immediate: true },
    );
  }

  return {
    hasAvatarFrame,
    isSubscriptionActive,
    frameImageUrl: AVATAR_FRAME_IMAGE_URL,
  };
}
