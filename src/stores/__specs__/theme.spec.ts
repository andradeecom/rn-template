import { UnistylesRuntime } from 'react-native-unistyles';
import { getStoredTheme, setStoredTheme } from '@/lib/theme-storage';
import { useThemeStore } from '@/stores/theme';

jest.mock('@/lib/theme-storage', () => ({
  ...jest.requireActual('@/lib/theme-storage'),
  getStoredTheme: jest.fn(),
  setStoredTheme: jest.fn(),
}));

jest.mock('react-native-unistyles', () => ({
  UnistylesRuntime: { setTheme: jest.fn() },
}));

const mockedStored = getStoredTheme as jest.MockedFunction<typeof getStoredTheme>;
const mockedSet = setStoredTheme as jest.MockedFunction<typeof setStoredTheme>;
const mockedSetTheme = UnistylesRuntime.setTheme as jest.MockedFunction<typeof UnistylesRuntime.setTheme>;

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.setState({ theme: 'light', isHydrated: false });
});

describe('initial state', () => {
  it('defaults to light before hydration resolves a stored choice', () => {
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().isHydrated).toBe(false);
  });
});

describe('useThemeStore.hydrate', () => {
  it('falls back to light when nothing was stored', async () => {
    mockedStored.mockResolvedValue(null);

    await useThemeStore.getState().hydrate();

    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().isHydrated).toBe(true);
  });

  it('restores a stored dark preference and applies it to Unistyles', async () => {
    mockedStored.mockResolvedValue('dark');

    await useThemeStore.getState().hydrate();

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(mockedSetTheme).toHaveBeenCalledWith('dark');
  });
});

describe('useThemeStore.setTheme', () => {
  it('applies the theme before persisting it', async () => {
    mockedSet.mockResolvedValue();

    await useThemeStore.getState().setTheme('dark');

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(mockedSetTheme).toHaveBeenCalledWith('dark');
    expect(mockedSet).toHaveBeenCalledWith('dark');
  });

  /*
   * Unistyles and React Navigation are two separate consumers of the theme.
   * Applying to the runtime but not the store would restyle screens while
   * leaving navigation chrome on the old theme.
   */
  it('keeps the store and the Unistyles runtime in agreement', async () => {
    mockedSet.mockResolvedValue();

    await useThemeStore.getState().setTheme('dark');
    await useThemeStore.getState().setTheme('light');

    expect(useThemeStore.getState().theme).toBe('light');
    expect(mockedSetTheme).toHaveBeenLastCalledWith('light');
  });
});

describe('useThemeStore.toggleTheme', () => {
  it('flips light to dark and back', async () => {
    mockedSet.mockResolvedValue();

    await useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    await useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
