import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled}
      {...rest}
    >
      {iconPosition === 'left' && icon}
      <Text variant={size === 'sm' ? 'caption' : 'label'} style={[textVariantStyles[variant]]}>
        {label}
      </Text>
      {iconPosition === 'right' && icon}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    gap: theme.spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
}));

const sizeStyles = StyleSheet.create((theme) => ({
  sm: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.radius.sm,
  },
  md: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.md,
  },
  lg: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.radius.lg,
  },
}));

const variantStyles = StyleSheet.create((theme) => ({
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: theme.colors.destructive,
  },
}));

const textVariantStyles = StyleSheet.create((theme) => ({
  primary: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.font.weights.semibold,
  },
  secondary: {
    color: theme.colors.secondaryForeground,
    fontWeight: theme.font.weights.medium,
  },
  outline: {
    color: theme.colors.foreground,
    fontWeight: theme.font.weights.medium,
  },
  ghost: {
    color: theme.colors.foreground,
    fontWeight: theme.font.weights.medium,
  },
  destructive: {
    color: theme.colors.destructiveForeground,
    fontWeight: theme.font.weights.semibold,
  },
}));
