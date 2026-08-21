import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from '@/hooks/use-locale';

/**
 * Platform-native bottom tabs: liquid glass on iOS 26+, Material 3 bottom
 * navigation on Android. The bar is rendered by the OS, so it is styled with
 * the native props below rather than with Unistyles — there is no React view to
 * apply a stylesheet to.
 *
 * Native tabs render no headers; screens that need one nest their own `Stack`.
 */
export function TabsNavigator() {
  const { t } = useTranslation();

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      {/* The home screen has no ScrollView, so on iOS 18 and earlier the bar
          would render transparent over it; profile scrolls and keeps the
          translucent scroll-edge behaviour that liquid glass relies on. */}
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
