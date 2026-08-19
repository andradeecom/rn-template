import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { getDeviceLocale, getStoredLocale, setStoredLocale } from '@/lib/locale-storage';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockedLocales = getLocales as jest.MockedFunction<typeof getLocales>;

const deviceLocales = (...tags: string[]) =>
  tags.map((tag) => ({ languageTag: tag, languageCode: tag.split('-')[0] })) as ReturnType<typeof getLocales>;

describe('getDeviceLocale', () => {
  beforeEach(() => jest.clearAllMocks());

  /*
   * getLocales() returns full tags like `pt-BR`. Matching the whole tag against
   * the supported list would miss it and fall through to English, so a
   * Brazilian device would get the wrong language despite `pt` shipping.
   */
  it('matches a regional tag to its base language', () => {
    mockedLocales.mockReturnValue(deviceLocales('pt-BR'));
    expect(getDeviceLocale()).toBe('pt');
  });

  it('walks the preference list to the first supported language', () => {
    mockedLocales.mockReturnValue(deviceLocales('ja-JP', 'de-DE', 'es-ES'));
    expect(getDeviceLocale()).toBe('es');
  });

  it('falls back to the default when none is supported', () => {
    mockedLocales.mockReturnValue(deviceLocales('ja-JP'));
    expect(getDeviceLocale()).toBe('en');
  });

  // expo-localization types the return as non-empty, but the runtime can hand
  // back an empty array on a device with no configured locales.
  it('falls back when the device reports no locales at all', () => {
    mockedLocales.mockReturnValue([] as unknown as ReturnType<typeof getLocales>);
    expect(getDeviceLocale()).toBe('en');
  });
});

describe('stored locale', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('round-trips a supported locale', async () => {
    await setStoredLocale('es');
    await expect(getStoredLocale()).resolves.toBe('es');
  });

  it('returns null when nothing is stored', async () => {
    await expect(getStoredLocale()).resolves.toBeNull();
  });

  // Storage is writable by anything in the app sandbox, so a value that is no
  // longer supported (or was never valid) must not be applied blindly.
  it('rejects a stored value that is not a supported locale', async () => {
    await AsyncStorage.setItem('app_locale', 'klingon');
    await expect(getStoredLocale()).resolves.toBeNull();
  });
});
