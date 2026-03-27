import { View, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, Input } from '@/components/atoms';

type InputFieldProps = TextInputProps & {
  label: string;
  rightLabel?: string;
  onRightLabelPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
};

export function InputField({
  label,
  rightLabel,
  onRightLabelPress,
  leftIcon,
  rightIcon,
  error,
  ...inputProps
}: InputFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text variant="label">{label}</Text>
        {rightLabel && (
          <Text variant="label" color="mutedForeground" onPress={onRightLabelPress}>
            {rightLabel}
          </Text>
        )}
      </View>
      <Input leftIcon={leftIcon} rightIcon={rightIcon} error={!!error} {...inputProps} />
      {error && (
        <Text variant="caption" color="destructive">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));
