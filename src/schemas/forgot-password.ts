import { z } from 'zod';
import { translate } from '@/i18n';

export const createForgotPasswordSchema = () =>
  z.object({
    email: z.string().min(1, translate('validation.emailRequired')).email(translate('validation.emailInvalid')),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
