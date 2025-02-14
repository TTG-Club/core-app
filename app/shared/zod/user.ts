import { z } from 'zod';
import { ROLE } from '~/shared/types';

export const userSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(ROLE),
});
