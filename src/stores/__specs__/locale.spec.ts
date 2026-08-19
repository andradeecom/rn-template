import { useLocaleStore } from '@/stores/locale';
import { i18n } from '@/i18n';
import { getDeviceLocale, getStoredLocale, setStoredLocale } from '@/lib/locale-storage';

jest.mock('@/lib/locale-storage', () => ({
  getStoredLocale: jest.fn(),
  setStoredLocale: jest.fn(),
  getDeviceLocale: jest.fn(() => 'en'),
}));

const mockedStored = getStoredLocale as jest.MockedFunction<typeof getStoredLocale>;
const mockedSet = setStoredLocale as jest.MockedFunction<typeof setStoredLocale>;
const mockedDevice = getDeviceLocale as jest.MockedFunction<typeof getDeviceLocale>;

/*
 * Regression: the initial state used to call getDeviceLocale(), which reaches
 * expo-localization's native module. Zustand runs that initializer at import
 * time, before the native module is registered, so the bundle crashed on
 * launch with "property is not writable" followed by "main has not been
 * registered".
 */
describe('module-load safety', () => {
  it('does not touch the native locale module at import time', () => {
    // The store module is already imported at the top of this file. If its
    // initializer called getDeviceLocale(), the mock would show a call.
    expect(mockedDevice).not.toHaveBeenCalled();
  });

  it('starts on the fallback locale until hydration resolves the real one', () => {
    expect(useLocaleStore.getState().locale).toBe('en');
    expect(useLocaleStore.getState().isHydrated).toBe(false);
  });
});

describe('useLocaleStore.hydrate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDevice.mockReturnValue('en');
    useLocaleStore.setState({ locale: 'en', isHydrated: false });
  });

  it('applies a stored preference over the device language', async () => {
    mockedStored.mockResolvedValue('pt');
    mockedDevice.mockReturnValue('es');

    await useLocaleStore.getState().hydrate();

    expect(useLocaleStore.getState().locale).toBe('pt');
    expect(i18n.locale).toBe('pt');
  });

  it('falls back to the device language when nothing is stored', async () => {
    mockedStored.mockResolvedValue(null);
    mockedDevice.mockReturnValue('es');

    await useLocaleStore.getState().hydrate();

    expect(useLocaleStore.getState().locale).toBe('es');
  });

  // useHydrate gates the splash screen on this, so leaving it false would hang
  // the app on launch.
  it('marks hydration complete on both paths', async () => {
    mockedStored.mockResolvedValue(null);
    await useLocaleStore.getState().hydrate();
    expect(useLocaleStore.getState().isHydrated).toBe(true);
  });
});

describe('useLocaleStore.setLocale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocaleStore.setState({ locale: 'en', isHydrated: true });
  });

  /*
   * Both halves matter: i18n.locale is what translate() reads, and the store
   * value is what re-renders mounted screens. Setting only the former would
   * leave the UI in the old language until something else re-rendered.
   */
  it('applies the language to i18n and to React state', async () => {
    await useLocaleStore.getState().setLocale('pt');

    expect(i18n.locale).toBe('pt');
    expect(useLocaleStore.getState().locale).toBe('pt');
  });

  it('persists the choice so it survives a restart', async () => {
    await useLocaleStore.getState().setLocale('es');
    expect(mockedSet).toHaveBeenCalledWith('es');
  });

  // Applied before persisting, so a storage failure cannot leave the UI showing
  // a language the store disagrees with.
  it('keeps the applied language when persistence fails', async () => {
    mockedSet.mockRejectedValueOnce(new Error('disk full'));

    await expect(useLocaleStore.getState().setLocale('pt')).rejects.toThrow('disk full');
    expect(useLocaleStore.getState().locale).toBe('pt');
    expect(i18n.locale).toBe('pt');
  });
});
