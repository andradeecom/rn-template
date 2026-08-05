import { z } from 'zod';
import { translate } from '@/i18n';

/**
 * `requireCurrent` mirrors the backend rule: users flagged `mustChangePassword`
 * (admin-created, still on a temporary password) are not asked for the current
 * one, everybody else is.
 */
export const createChangePasswordSchema = (requireCurrent = true) =>
  z
    .object({
      currentPassword: requireCurrent
        ? z.string().min(1, translate('validation.currentPasswordRequired'))
        : z.string().optional(),
      newPassword: z
        .string()
        .min(1, translate('validation.passwordRequired'))
        .min(8, translate('validation.passwordMinLength', { count: 8 })),
      confirmPassword: z.string().min(1, translate('validation.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: translate('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    });

export type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;
