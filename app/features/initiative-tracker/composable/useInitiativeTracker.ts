import type {
  ActiveCreatureBlock,
  CreatureParticipantPayload,
  EncounterDifficulty,
  HpAmountPayload,
  HpPatchPayload,
  InitiativeParticipant,
  InitiativeRollMode,
  InitiativeTracker,
  ParticipantStatePayload,
  PlayerParticipantPayload,
  TrackerSettingsPayload,
} from '../model';

import {
  activeCreatureBlockSchema,
  encounterDifficultySchema,
  INITIATIVE_TRACKER_ENDPOINTS,
  INITIATIVE_TRACKER_LOCAL_STORAGE_KEY,
  initiativeTrackerSchema,
} from '../model';

interface UseInitiativeTrackerOptions {
  trackerId?: string;
  shareToken?: string;
  readonly?: boolean;
}

interface UseInitiativeTrackerReturn {
  tracker: Ref<InitiativeTracker | null>;
  activeBlock: Ref<ActiveCreatureBlock | null>;
  difficulty: Ref<EncounterDifficulty | null>;
  error: Ref<unknown>;
  status: Ref<string>;
  pendingAction: Ref<string | null>;
  isReadonly: ComputedRef<boolean>;
  isLocalMode: Ref<boolean>;
  fetchTracker: () => Promise<void>;
  fetchActiveBlock: () => Promise<void>;
  fetchDifficulty: () => Promise<void>;
  updateSettings: (payload: TrackerSettingsPayload) => Promise<void>;
  addPlayer: (payload: PlayerParticipantPayload) => Promise<void>;
  addCreature: (payload: CreatureParticipantPayload) => Promise<void>;
  startBattle: () => Promise<void>;
  previousTurn: () => Promise<void>;
  nextTurn: () => Promise<void>;
  previousRound: () => Promise<void>;
  nextRound: () => Promise<void>;
  rerollRound: () => Promise<void>;
  finishBattle: () => Promise<void>;
  damageParticipant: (
    participantId: string,
    payload: HpAmountPayload,
  ) => Promise<void>;
  healParticipant: (
    participantId: string,
    payload: HpAmountPayload,
  ) => Promise<void>;
  setTemporaryHp: (
    participantId: string,
    payload: HpAmountPayload,
  ) => Promise<void>;
  patchParticipantHp: (
    participantId: string,
    payload: HpPatchPayload,
  ) => Promise<void>;
  patchParticipantState: (
    participantId: string,
    payload: ParticipantStatePayload,
  ) => Promise<void>;
  recalculateDifficulty: () => Promise<void>;
  enableShare: () => Promise<void>;
  disableShare: () => Promise<void>;
}

function resolveTrackerEndpoint(options: UseInitiativeTrackerOptions): string {
  if (options.shareToken) {
    return INITIATIVE_TRACKER_ENDPOINTS.shared(options.shareToken);
  }

  if (options.trackerId) {
    return INITIATIVE_TRACKER_ENDPOINTS.tracker(options.trackerId);
  }

  return INITIATIVE_TRACKER_ENDPOINTS.current;
}

function readTrackerId(tracker: InitiativeTracker | null): string {
  if (!tracker) {
    throw new Error('Трекер инициативы еще не загружен.');
  }

  return tracker.id;
}

function createLocalId(prefix: string): string {
  if (import.meta.client && window.crypto.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createLocalTracker(): InitiativeTracker {
  return {
    id: createLocalId('local-tracker'),
    title: 'Локальный бой',
    status: 'SETUP',
    currentRound: 1,
    currentParticipantId: undefined,
    rerollEachRound: false,
    groupSameCreaturesInitiative: false,
    shareToken: undefined,
    encounterDifficulty: undefined,
    participants: [],
  };
}

function readLocalTracker(): InitiativeTracker {
  if (!import.meta.client) {
    return createLocalTracker();
  }

  const storedTracker = window.localStorage.getItem(
    INITIATIVE_TRACKER_LOCAL_STORAGE_KEY,
  );

  if (!storedTracker) {
    return createLocalTracker();
  }

  try {
    const parsedTracker: unknown = JSON.parse(storedTracker);
    const trackerResult = initiativeTrackerSchema.safeParse(parsedTracker);

    return trackerResult.success ? trackerResult.data : createLocalTracker();
  } catch {
    return createLocalTracker();
  }
}

function writeLocalTracker(tracker: InitiativeTracker): InitiativeTracker {
  if (import.meta.client) {
    window.localStorage.setItem(
      INITIATIVE_TRACKER_LOCAL_STORAGE_KEY,
      JSON.stringify(tracker),
    );
  }

  return tracker;
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function createRolls(
  rollMode: InitiativeRollMode,
  manualRollValue: number | undefined,
): Array<{ value: number; discarded: boolean }> {
  if (rollMode === 'MANUAL') {
    return [{ value: manualRollValue ?? 10, discarded: false }];
  }

  if (rollMode === 'NORMAL') {
    return [{ value: rollD20(), discarded: false }];
  }

  const firstRoll = rollD20();
  const secondRoll = rollD20();

  const shouldDiscardFirst =
    rollMode === 'ADVANTAGE' ? firstRoll < secondRoll : firstRoll > secondRoll;

  return [
    { value: firstRoll, discarded: shouldDiscardFirst },
    { value: secondRoll, discarded: !shouldDiscardFirst },
  ];
}

function getSelectedRoll(
  rolls: Array<{ value: number; discarded: boolean }>,
): number {
  return rolls.find((roll) => !roll.discarded)?.value ?? 10;
}

function rollParticipantInitiative(
  participant: InitiativeParticipant,
): InitiativeParticipant {
  const rolls = createRolls(participant.rollMode, participant.rollValue);

  return {
    ...participant,
    rolls,
    initiative: getSelectedRoll(rolls) + participant.initiativeBonus,
  };
}

function sortParticipants(
  participants: Array<InitiativeParticipant>,
): Array<InitiativeParticipant> {
  return [...participants].sort((firstParticipant, secondParticipant) => {
    if (secondParticipant.initiative !== firstParticipant.initiative) {
      return secondParticipant.initiative - firstParticipant.initiative;
    }

    return secondParticipant.dexterityBonus - firstParticipant.dexterityBonus;
  });
}

function findNextActiveParticipantId(
  tracker: InitiativeTracker,
  step: number,
): string | undefined {
  const aliveParticipants = tracker.participants.filter((participant) => {
    return participant.state !== 'DEAD';
  });

  if (!aliveParticipants.length) {
    return undefined;
  }

  const currentIndex = aliveParticipants.findIndex((participant) => {
    return participant.id === tracker.currentParticipantId;
  });

  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  const nextIndex =
    (safeCurrentIndex + step + aliveParticipants.length)
    % aliveParticipants.length;

  return aliveParticipants[nextIndex]?.id;
}

function updateLocalParticipant(
  tracker: InitiativeTracker,
  participantId: string,
  updateParticipant: (
    participant: InitiativeParticipant,
  ) => InitiativeParticipant,
): InitiativeTracker {
  return {
    ...tracker,
    participants: tracker.participants.map((participant) => {
      if (participant.id !== participantId) {
        return participant;
      }

      return updateParticipant(participant);
    }),
  };
}

function createPlayerParticipant(
  payload: PlayerParticipantPayload,
): InitiativeParticipant {
  return rollParticipantInitiative({
    id: createLocalId('local-player'),
    type: 'PLAYER',
    relationType: payload.relationType,
    name: payload.name,
    level: payload.level,
    sourceCreatureId: undefined,
    initiative: 0,
    initiativeBonus: payload.initiativeBonus,
    dexterityBonus: payload.dexterityBonus,
    rollMode: payload.rollMode,
    rollValue: payload.rollValue,
    rolls: [],
    hpMax: payload.hpMax,
    hpCurrent: payload.hpCurrent,
    hpTemporary: payload.hpTemporary,
    state: 'ACTIVE',
  });
}

function createCreatureParticipants(
  payload: CreatureParticipantPayload,
): Array<InitiativeParticipant> {
  return Array.from(
    { length: payload.count },
    (unusedValue, participantIndex) =>
      rollParticipantInitiative({
        id: createLocalId('local-creature'),
        type: 'CREATURE',
        relationType: payload.relationType,
        name:
          payload.count > 1
            ? `${payload.sourceCreatureId} ${participantIndex + 1}`
            : payload.sourceCreatureId,
        level: undefined,
        sourceCreatureId: payload.sourceCreatureId,
        initiative: 0,
        initiativeBonus: 0,
        dexterityBonus: 0,
        rollMode: payload.rollMode,
        rollValue: payload.rollValue,
        rolls: [],
        hpMax: payload.hpMax ?? 1,
        hpCurrent: payload.hpCurrent ?? payload.hpMax ?? 1,
        hpTemporary: 0,
        state: 'ACTIVE',
      }),
  );
}

function setParticipantDeadWhenEmpty(
  participant: InitiativeParticipant,
): InitiativeParticipant {
  if (participant.hpCurrent > 0) {
    return participant;
  }

  return {
    ...participant,
    state: 'DEAD',
  };
}

async function requestTracker(
  endpoint: string,
  options?: Parameters<typeof $fetch>[1],
): Promise<InitiativeTracker> {
  const response = await $fetch<unknown>(endpoint, options);

  return initiativeTrackerSchema.parse(response);
}

function requestAction(
  endpoint: string,
  options?: Parameters<typeof $fetch>[1],
): Promise<InitiativeTracker> {
  return requestTracker(endpoint, {
    method: 'POST',
    ...options,
  });
}

export function useInitiativeTracker(
  options: UseInitiativeTrackerOptions = {},
): UseInitiativeTrackerReturn {
  const tracker = shallowRef<InitiativeTracker | null>(null);
  const activeBlock = shallowRef<ActiveCreatureBlock | null>(null);
  const difficulty = shallowRef<EncounterDifficulty | null>(null);
  const error = shallowRef<unknown>(null);
  const status = ref('idle');
  const pendingAction = ref<string | null>(null);
  const isLocalMode = ref(false);

  const isReadonly = computed(() => Boolean(options.readonly));

  async function fetchTracker(): Promise<void> {
    status.value = 'pending';

    try {
      tracker.value = await requestTracker(resolveTrackerEndpoint(options));
      isLocalMode.value = false;
      error.value = null;
      status.value = 'success';
    } catch (fetchError) {
      if (options.shareToken || options.trackerId) {
        error.value = fetchError;
        status.value = 'error';

        throw fetchError;
      }

      isLocalMode.value = true;
      tracker.value = writeLocalTracker(readLocalTracker());
      error.value = null;
      status.value = 'success';
    }
  }

  async function replaceTracker(
    actionName: string,
    action: () => Promise<InitiativeTracker>,
  ): Promise<void> {
    if (isReadonly.value) {
      return;
    }

    pendingAction.value = actionName;

    try {
      const updatedTracker = await action();

      tracker.value = isLocalMode.value
        ? writeLocalTracker(updatedTracker)
        : updatedTracker;

      await Promise.all([fetchActiveBlock(), fetchDifficulty()]);
    } finally {
      pendingAction.value = null;
    }
  }

  async function fetchActiveBlock(): Promise<void> {
    const currentTracker = tracker.value;

    if (!currentTracker?.currentParticipantId || isLocalMode.value) {
      activeBlock.value = null;

      return;
    }

    const endpoint = options.shareToken
      ? INITIATIVE_TRACKER_ENDPOINTS.sharedActive(options.shareToken)
      : INITIATIVE_TRACKER_ENDPOINTS.active(currentTracker.id);

    const response = await $fetch<unknown>(endpoint);

    activeBlock.value = activeCreatureBlockSchema.parse(response);
  }

  async function fetchDifficulty(): Promise<void> {
    const currentTracker = tracker.value;

    if (!currentTracker || options.shareToken || isLocalMode.value) {
      difficulty.value = currentTracker?.encounterDifficulty ?? null;

      return;
    }

    const response = await $fetch<unknown>(
      INITIATIVE_TRACKER_ENDPOINTS.difficulty(currentTracker.id),
    );

    difficulty.value = encounterDifficultySchema.parse(response);
  }

  async function updateSettings(
    payload: TrackerSettingsPayload,
  ): Promise<void> {
    await replaceTracker('settings', () =>
      isLocalMode.value
        ? Promise.resolve({
            ...readLocalTracker(),
            ...payload,
          })
        : requestTracker(
            INITIATIVE_TRACKER_ENDPOINTS.settings(readTrackerId(tracker.value)),
            {
              method: 'PATCH',
              body: payload,
            },
          ),
    );
  }

  async function addPlayer(payload: PlayerParticipantPayload): Promise<void> {
    await replaceTracker('add-player', () =>
      isLocalMode.value
        ? Promise.resolve({
            ...readLocalTracker(),
            participants: [
              ...readLocalTracker().participants,
              createPlayerParticipant(payload),
            ],
          })
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.participants(
              readTrackerId(tracker.value),
            ),
            {
              body: payload,
            },
          ),
    );
  }

  async function addCreature(
    payload: CreatureParticipantPayload,
  ): Promise<void> {
    await replaceTracker('add-creature', () =>
      isLocalMode.value
        ? Promise.resolve({
            ...readLocalTracker(),
            participants: [
              ...readLocalTracker().participants,
              ...createCreatureParticipants(payload),
            ],
          })
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.participants(
              readTrackerId(tracker.value),
            ),
            {
              body: payload,
            },
          ),
    );
  }

  async function startBattle(): Promise<void> {
    await replaceTracker('start', () =>
      isLocalMode.value
        ? Promise.resolve(
            (() => {
              const localTracker = readLocalTracker();
              const participants = sortParticipants(localTracker.participants);

              return {
                ...localTracker,
                status: 'ACTIVE',
                currentRound: 1,
                participants,
                currentParticipantId: participants.find((participant) => {
                  return participant.state !== 'DEAD';
                })?.id,
              };
            })(),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.start(readTrackerId(tracker.value)),
          ),
    );
  }

  async function previousTurn(): Promise<void> {
    await replaceTracker('previous-turn', () =>
      isLocalMode.value
        ? Promise.resolve(
            (() => {
              const localTracker = readLocalTracker();

              return {
                ...localTracker,
                currentParticipantId: findNextActiveParticipantId(
                  localTracker,
                  -1,
                ),
              };
            })(),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.previousTurn(
              readTrackerId(tracker.value),
            ),
          ),
    );
  }

  async function nextTurn(): Promise<void> {
    await replaceTracker('next-turn', () =>
      isLocalMode.value
        ? Promise.resolve(
            (() => {
              const localTracker = readLocalTracker();

              return {
                ...localTracker,
                currentParticipantId: findNextActiveParticipantId(
                  localTracker,
                  1,
                ),
              };
            })(),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.nextTurn(readTrackerId(tracker.value)),
          ),
    );
  }

  async function previousRound(): Promise<void> {
    await replaceTracker('previous-round', () =>
      isLocalMode.value
        ? Promise.resolve(
            (() => {
              const localTracker = readLocalTracker();

              return {
                ...localTracker,
                currentRound: Math.max(1, localTracker.currentRound - 1),
              };
            })(),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.previousRound(
              readTrackerId(tracker.value),
            ),
          ),
    );
  }

  async function nextRound(): Promise<void> {
    await replaceTracker('next-round', () =>
      isLocalMode.value
        ? Promise.resolve(
            (() => {
              const localTracker = readLocalTracker();
              const shouldReroll = localTracker.rerollEachRound;

              const participants = shouldReroll
                ? sortParticipants(
                    localTracker.participants.map(rollParticipantInitiative),
                  )
                : localTracker.participants;

              return {
                ...localTracker,
                currentRound: localTracker.currentRound + 1,
                participants,
                currentParticipantId: participants.find((participant) => {
                  return participant.state !== 'DEAD';
                })?.id,
              };
            })(),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.nextRound(
              readTrackerId(tracker.value),
            ),
          ),
    );
  }

  async function rerollRound(): Promise<void> {
    await replaceTracker('reroll-round', () =>
      isLocalMode.value
        ? Promise.resolve(
            (() => {
              const localTracker = readLocalTracker();

              const participants = sortParticipants(
                localTracker.participants.map(rollParticipantInitiative),
              );

              return {
                ...localTracker,
                participants,
                currentParticipantId: participants.find((participant) => {
                  return participant.state !== 'DEAD';
                })?.id,
              };
            })(),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.rerollRound(
              readTrackerId(tracker.value),
            ),
          ),
    );
  }

  async function finishBattle(): Promise<void> {
    await replaceTracker('finish', () =>
      isLocalMode.value
        ? Promise.resolve({
            ...readLocalTracker(),
            status: 'FINISHED',
          })
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.finish(readTrackerId(tracker.value)),
          ),
    );
  }

  async function damageParticipant(
    participantId: string,
    payload: HpAmountPayload,
  ): Promise<void> {
    await replaceTracker('damage', () =>
      isLocalMode.value
        ? Promise.resolve(
            updateLocalParticipant(
              readLocalTracker(),
              participantId,
              (participant) => {
                const temporaryDamage = Math.min(
                  participant.hpTemporary,
                  payload.amount,
                );

                const remainingDamage = payload.amount - temporaryDamage;

                return setParticipantDeadWhenEmpty({
                  ...participant,
                  hpTemporary: participant.hpTemporary - temporaryDamage,
                  hpCurrent: Math.max(
                    0,
                    participant.hpCurrent - remainingDamage,
                  ),
                });
              },
            ),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.participantDamage(participantId),
            {
              body: payload,
            },
          ),
    );
  }

  async function healParticipant(
    participantId: string,
    payload: HpAmountPayload,
  ): Promise<void> {
    await replaceTracker('heal', () =>
      isLocalMode.value
        ? Promise.resolve(
            updateLocalParticipant(
              readLocalTracker(),
              participantId,
              (participant) => ({
                ...participant,
                hpCurrent: Math.min(
                  participant.hpMax,
                  participant.hpCurrent + payload.amount,
                ),
                state:
                  participant.state === 'DEAD' ? 'ACTIVE' : participant.state,
              }),
            ),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.participantHeal(participantId),
            {
              body: payload,
            },
          ),
    );
  }

  async function setTemporaryHp(
    participantId: string,
    payload: HpAmountPayload,
  ): Promise<void> {
    await replaceTracker('temporary-hp', () =>
      isLocalMode.value
        ? Promise.resolve(
            updateLocalParticipant(
              readLocalTracker(),
              participantId,
              (participant) => ({
                ...participant,
                hpTemporary: payload.amount,
              }),
            ),
          )
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.participantTemporaryHp(participantId),
            {
              body: payload,
            },
          ),
    );
  }

  async function patchParticipantHp(
    participantId: string,
    payload: HpPatchPayload,
  ): Promise<void> {
    await replaceTracker('patch-hp', () =>
      isLocalMode.value
        ? Promise.resolve(
            updateLocalParticipant(
              readLocalTracker(),
              participantId,
              (participant) =>
                setParticipantDeadWhenEmpty({
                  ...participant,
                  hpMax: payload.hpMax,
                  hpCurrent: payload.hpCurrent,
                  hpTemporary: payload.hpTemporary,
                }),
            ),
          )
        : requestTracker(
            INITIATIVE_TRACKER_ENDPOINTS.participantHp(participantId),
            {
              method: 'PATCH',
              body: payload,
            },
          ),
    );
  }

  async function patchParticipantState(
    participantId: string,
    payload: ParticipantStatePayload,
  ): Promise<void> {
    await replaceTracker('patch-state', () =>
      isLocalMode.value
        ? Promise.resolve(
            updateLocalParticipant(
              readLocalTracker(),
              participantId,
              (participant) => ({
                ...participant,
                state: payload.state,
              }),
            ),
          )
        : requestTracker(
            INITIATIVE_TRACKER_ENDPOINTS.participantState(participantId),
            {
              method: 'PATCH',
              body: payload,
            },
          ),
    );
  }

  async function recalculateDifficulty(): Promise<void> {
    await replaceTracker('difficulty', () =>
      isLocalMode.value
        ? Promise.resolve(readLocalTracker())
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.recalculateDifficulty(
              readTrackerId(tracker.value),
            ),
          ),
    );
  }

  async function enableShare(): Promise<void> {
    await replaceTracker('share', () =>
      isLocalMode.value
        ? Promise.resolve(readLocalTracker())
        : requestAction(
            INITIATIVE_TRACKER_ENDPOINTS.share(readTrackerId(tracker.value)),
          ),
    );
  }

  async function disableShare(): Promise<void> {
    await replaceTracker('share-disable', () =>
      isLocalMode.value
        ? Promise.resolve(readLocalTracker())
        : requestTracker(
            INITIATIVE_TRACKER_ENDPOINTS.share(readTrackerId(tracker.value)),
            {
              method: 'DELETE',
            },
          ),
    );
  }

  return {
    tracker,
    activeBlock,
    difficulty,
    error,
    status,
    pendingAction,
    isReadonly,
    isLocalMode,
    fetchTracker,
    fetchActiveBlock,
    fetchDifficulty,
    updateSettings,
    addPlayer,
    addCreature,
    startBattle,
    previousTurn,
    nextTurn,
    previousRound,
    nextRound,
    rerollRound,
    finishBattle,
    damageParticipant,
    healParticipant,
    setTemporaryHp,
    patchParticipantHp,
    patchParticipantState,
    recalculateDifficulty,
    enableShare,
    disableShare,
  };
}
