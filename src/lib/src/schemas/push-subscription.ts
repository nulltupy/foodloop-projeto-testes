import { z } from 'zod';

export const RegistrarPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  user_agent: z.string().optional(),
  expiration_time: z.number().nullable().optional(),
});

export type RegistrarPushSubscription = z.infer<typeof RegistrarPushSubscriptionSchema>;
