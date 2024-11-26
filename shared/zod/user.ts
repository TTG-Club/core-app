import { z } from 'zod';
import { ROLE } from '~~/shared/types/user';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  role: z.nativeEnum(ROLE),
});
