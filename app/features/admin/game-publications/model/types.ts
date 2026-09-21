import type { z as validation } from 'zod';

import type {
  publicationChannelFormSchema,
  publicationChannelSchema,
  publicationPlatformSchema,
  publicationSettingsFormSchema,
  publicationSlotSchema,
} from './schema';

export type PublicationSlot = validation.infer<typeof publicationSlotSchema>;
export type PublicationPlatform = validation.infer<
  typeof publicationPlatformSchema
>;
export type PublicationChannel = validation.infer<
  typeof publicationChannelSchema
>;
export type PublicationChannelForm = validation.infer<
  typeof publicationChannelFormSchema
>;
export type PublicationSettingsForm = validation.infer<
  typeof publicationSettingsFormSchema
>;
