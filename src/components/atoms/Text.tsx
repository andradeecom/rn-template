import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'label' | 'caption' | 'overline';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: 'foreground' | 'mutedForeground' | 'primaryForeground' | 'destructive' | 'primary';
};

export function Text({ style, variant = 'body', color = 'foreground', ...rest }: TextProps) {
  return <RNText style={[styles.base, variantStyles[variant], colorStyles[color], style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  base: {
    fontFamily: theme.font.family,
    color: theme.colors.foreground,
  },
}));

const variantStyles = StyleSheet.create((theme) => ({
  h1: {
    fontSize: theme.font.sizes['4xl'],
    lineHeight: theme.font.lineHeights['4xl'],
    fontWeight: theme.font.weights.bold,
    letterSpacing: theme.font.letterSpacing.tight,
  },
  h2: {
    fontSize: theme.font.sizes['2xl'],
    lineHeight: theme.font.lineHeights['2xl'],
    fontWeight: theme.font.weights.semibold,
    letterSpacing: theme.font.letterSpacing.tight,
  },
  h3: {
    fontSize: theme.font.sizes.xl,
    lineHeight: theme.font.lineHeights.xl,
    fontWeight: theme.font.weights.semibold,
  },
  body: {
    fontSize: theme.font.sizes.base,
    lineHeight: theme.font.lineHeights.base,
    fontWeight: theme.font.weights.regular,
  },
  bodySmall: {
    fontSize: theme.font.sizes.sm,
    lineHeight: theme.font.lineHeights.sm,
    fontWeight: theme.font.weights.regular,
  },
  label: {
    fontSize: theme.font.sizes.sm,
    lineHeight: theme.font.lineHeights.sm,
    fontWeight: theme.font.weights.medium,
  },
  caption: {
    fontSize: theme.font.sizes.xs,
    lineHeight: theme.font.lineHeights.xs,
    fontWeight: theme.font.weights.regular,
  },
  overline: {
    fontSize: theme.font.sizes.xs,
    lineHeight: theme.font.lineHeights.xs,
    fontWeight: theme.font.weights.medium,
    letterSpacing: theme.font.letterSpacing.wider,
    textTransform: 'uppercase',
  },
}));

const colorStyles = StyleSheet.create((theme) => ({
  foreground: { color: theme.colors.foreground },
  mutedForeground: { color: theme.colors.mutedForeground },
  primaryForeground: { color: theme.colors.primaryForeground },
  destructive: { color: theme.colors.destructive },
  primary: { color: theme.colors.primary },
}));
