/**
 * Provider contracts — the boundary between the app and whatever backend it is
 * talking to.
 *
 * ## On the naming
 *
 * These are "ports" in the Hexagonal Architecture sense (Cockburn, 2005), and
 * specifically *driven* ports: contracts the app declares and an outside actor
 * implements. Clean Architecture calls the same construct an output port, and
 * would name its implementations gateways or repositories. The two are siblings
 * — both are Dependency Inversion applied at an architectural boundary — so the
 * structure here would be unchanged under either vocabulary.
 *
 * "Port" was chosen over "interface" or "service" for local clarity, not
 * doctrine: `interface` is a TypeScript keyword, and `AuthService` would read as
 * a sibling of `src/services/auth.ts`, which actually sits *below* this
 * boundary as one provider's implementation detail.
 *
 * ## What this is not
 *
 * This is deliberately not a full Clean Architecture interior. There are no
 * entities and no use-case interactors; React Query hooks (`src/hooks/*`) play
 * the use-case role directly, and framework types — mutations, Zustand stores,
 * Expo Router navigation — live immediately above this boundary rather than
 * being held at arm's length behind another layer.
 *
 * That is a considered trade, not an oversight. React Query already owns
 * caching, retry, and invalidation semantics; wrapping it in framework-free
 * interactors would mean reimplementing those to satisfy a layering rule. The
 * inversion is applied at the one boundary that actually changes — the backend
 * provider — and nowhere it would only add ceremony.
 *
 * See docs/backend-adapters.md.
 */

import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResetPasswordRequest,
  User,
  VerifyEmailRequest,
} from '@/types/auth';

/**
 * The contract every backend provider must satisfy.
 *
 * This is the seam that makes the provider swappable. It is written in terms of
 * the app's own domain types (`@/types/auth`) and nothing else — no axios
 * response, no Supabase `Session`, no provider error class. A type that leaks
 * through here would force every caller to know which provider is installed,
 * which is exactly what this layer exists to prevent.
 *
 * Deliberately absent: the credential. `login` resolves to `{ user }` only.
 * The two providers authenticate in fundamentally different ways — an opaque
 * server session id delivered as `Set-Cookie` versus a JWT/refresh pair in the
 * response body — and each adapter persists its own, internally. Putting a
 * session on this contract would mean hooks and stores branching on the shape
 * of a credential they have no business reading.
 */
export type AuthPort = {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  forgotPassword: (payload: ForgotPasswordRequest) => Promise<MessageResponse>;
  resetPassword: (payload: ResetPasswordRequest) => Promise<MessageResponse>;
  changePassword: (payload: ChangePasswordRequest) => Promise<MessageResponse>;
  verifyEmail: (payload: VerifyEmailRequest) => Promise<MessageResponse>;
  resendVerification: (payload: ResendVerificationRequest) => Promise<MessageResponse>;
  googleLogin: (request: GoogleLoginRequest) => Promise<LoginResponse>;
  me: () => Promise<User>;
  logout: () => Promise<MessageResponse>;

  /**
   * Ends every session for the user, not just this device's.
   *
   * Kept on the contract even though the two providers implement it very
   * differently (a dedicated endpoint here, a global sign-out scope there),
   * because "sign out everywhere" is a product guarantee the UI offers — not an
   * implementation detail of one backend.
   */
  logoutAll: () => Promise<MessageResponse>;

  /**
   * Drops this device's credential without calling the server.
   *
   * The api client's 401 handler and the logout hooks both need to clear
   * whatever the active adapter persisted, without knowing what that is. For
   * the REST provider it is the keystored session id and the cookie jar; for
   * Supabase it would be the stored token pair.
   */
  clearSession: () => Promise<void>;
};

/**
 * Everything a provider supplies. Auth is the only domain the template ships,
 * but new domains belong here as sibling keys (`profile`, `billing`, …) so a
 * provider stays a single cohesive object rather than a scatter of imports.
 *
 * Adding one means three edits: a port type in this file, a key here, and an
 * implementation in *every* provider. The contract test
 * (`__specs__/ports.spec.ts`) then covers it for all of them at once — it runs
 * a single suite per registered adapter, so a provider that forgets the new
 * domain fails rather than silently going missing at runtime.
 *
 * @example A billing port, for swapping payment providers
 *
 * Payments are the natural next domain, and the one where this layer earns the
 * most: provider lock-in is expensive, and the SDKs disagree about nearly
 * everything. The shape would follow `AuthPort`'s rules exactly —
 *
 * ```ts
 * export type BillingPort = {
 *   getSubscription: () => Promise<Subscription | null>;
 *   listPlans: () => Promise<Plan[]>;
 *   startCheckout: (plan: PlanId) => Promise<CheckoutSession>;
 *   cancelSubscription: () => Promise<MessageResponse>;
 *   restorePurchases: () => Promise<Subscription | null>;
 * };
 * ```
 *
 * — written in the app's own types (`Subscription`, `Plan`), never Stripe's
 * `Stripe.Subscription` or RevenueCat's `CustomerInfo`. Same reasoning as the
 * credential above: what leaks through the contract is what every caller ends
 * up coupled to.
 *
 * Two things to get right when the time comes:
 *
 * 1. **Payments are a separate axis from the backend.** A Supabase backend with
 *    Stripe billing, or a REST backend with RevenueCat, are both ordinary
 *    combinations. If billing ends up varying independently, give it its own
 *    `EXPO_PUBLIC_BILLING_PROVIDER` and resolve it separately in the container
 *    rather than forcing one `ProviderName` to pick both — otherwise every
 *    backend/payment pairing has to be enumerated as its own provider.
 * 2. **Never trust the client for entitlement.** `getSubscription` reports what
 *    the server believes, not what the store SDK reports locally; a jailbroken
 *    device can say anything. The port returns a server-verified answer, which
 *    also keeps the two providers genuinely interchangeable — store receipts
 *    are not portable, verified entitlement state is.
 *
 * Note that App Store / Play Store policy requires their IAP for digital goods,
 * so a native billing adapter is usually a store SDK (RevenueCat, Expo IAP)
 * rather than a card processor. Stripe is the right implementation for a web
 * checkout or for physical goods — which is exactly the sort of swap this port
 * is meant to absorb.
 */
export type BackendAdapter = {
  name: ProviderName;
  auth: AuthPort;

  // billing?: BillingPort;  ← see the example above
};

export type ProviderName = 'api' | 'supabase';
