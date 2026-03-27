import { z } from 'zod';
import { translate } from '@/i18n';

export const createLoginSchema = () =>
  z.object({
    email: z.string().min(1, translate('validation.emailRequired')).email(translate('validation.emailInvalid')),
    password: z
      .string()
      .min(1, translate('validation.passwordRequired'))
      .min(6, translate('validation.passwordMinLength', { count: 6 })),
  });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
