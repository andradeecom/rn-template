const en = {
  common: {
    welcome: 'Welcome, {{name}}!',
    loading: 'Loading...',
    signOut: 'Sign Out',
  },
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    hidePassword: 'Hide',
    showPassword: 'Show',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Login to Dashboard  →',
    signingIn: 'Signing in...',
    or: 'OR',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    support: 'Support',
  },
  validation: {
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least {{count}} characters',
  },
  home: {
    greeting: 'Hello {{name}}',
    welcomeBack: 'Welcome back to your dashboard',
  },
  profile: {
    account: 'Account',
    theme: 'Theme',
    themeSystem: 'System',
    notifications: 'Notifications',
    notificationsEnabled: 'Enabled',
  },
  tabs: {
    home: 'Home',
    profile: 'Profile',
  },
  errors: {
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid credentials',
    generic: 'Something went wrong',
  },
};

export default en;
export type Translations = typeof en;
