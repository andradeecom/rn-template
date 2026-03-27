import { View } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from './Text';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  uri?: string;
  fallback?: string;
  size?: AvatarSize;
};

const SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

export function Avatar({ uri, fallback, size = 'md' }: AvatarProps) {
  const dimension = SIZES[size];
  const initials = fallback
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <Text variant={size === 'xl' ? 'h2' : size === 'lg' ? 'h3' : 'label'} color="mutedForeground">
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}));
