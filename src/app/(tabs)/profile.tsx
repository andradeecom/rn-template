import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { ProfileCard } from '@/components/organisms';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileCard name={fullName} email={user?.email ?? ''} onLogout={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
}));
