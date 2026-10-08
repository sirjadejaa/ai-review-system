import { z } from 'zod';

export const CreateAdminUserInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and dashes'),
  passwordHash: z.string().min(10, 'Valid password hash required'),
});

export type CreateAdminUserInput = z.infer<typeof CreateAdminUserInputSchema>;
