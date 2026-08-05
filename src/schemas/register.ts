import { z } from 'zod';
import { translate } from '@/i18n';

export const createRegisterSchema = () =>
  z
    .object({
      firstName: z.string().min(1, translate('validation.firstNameRequired')),
      lastName: z.string().min(1, translate('validation.lastNameRequired')),
      email: z.string().min(1, translate('validation.emailRequired')).email(translate('validation.emailInvalid')),
      // The backend enforces a minimum of 8 characters on registration.
      password: z
        .string()
        .min(1, translate('validation.passwordRequired'))
        .min(8, translate('validation.passwordMinLength', { count: 8 })),
      confirmPassword: z.string().min(1, translate('validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: translate('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
