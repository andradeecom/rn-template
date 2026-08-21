# Storage

All persistence goes through `src/lib/storage`, which exposes one contract and
two instances split by **security guarantee** — not by library.

| Instance        | Backed by           | Holds                                           |
| --------------- | ------------------- | ----------------------------------------------- |
| `secureStorage` | `expo-secure-store` | session ids, CSRF tokens, OAuth token pairs     |
| `deviceStorage` | AsyncStorage        | cached profile, chosen language, UI preferences |

```ts
import { secureStorage, deviceStorage } from '@/lib/storage';

await secureStorage.set('session_id', id);
const locale = await deviceStorage.get('app_locale');
```

Picking an instance is a security decision. Which library sits behind it is
not, and can change without callers noticing — that is the point of the seam.

## Why the split is secure-vs-device

`secureStorage` is Keychain on iOS and Keystore-backed
EncryptedSharedPreferences on Android: the mobile counterpart of an httpOnly
cookie, where the app can use a value without other processes reading it.

`deviceStorage` is plain unencrypted files inside the app sandbox — readable on
a rooted or jailbroken device, and out of an unencrypted backup. **It must never
hold a credential.**

`__specs__/boundaries.spec.ts` asserts this: a credential routed to
`deviceStorage` fails five tests. That mistake is invisible in review, because
both calls look identical at the call site.

## The port is async on both sides

Even though `deviceStorage`'s likely future backend (MMKV) is synchronous. A
port cannot be made async later without touching every call site, but a sync
backend wraps trivially in a resolved promise — so the cost is paid once, in the
contract, rather than by a migration.

## Chunking in secureStorage

Values are split across numbered keys: the base key holds a chunk count,
`${key}.0`, `${key}.1`, … hold the parts.

Expo enforces no size limit of its own, but the platform underneath does — some
iOS releases reject values above roughly 2048 bytes, and the rejection arrives
as a **native throw**, not a silent no-op. For a credential write that is a bad
failure: the token is never persisted, and the user appears to be logged out at
random much later, far from the cause. An OAuth session carrying custom claims
can reach that size.

Three properties make this safe, each pinned by a test:

- **The cut is blind.** A fixed offset, knowing nothing about the value's
  structure. A JWT is sliced mid-token and rejoined byte-for-byte — never
  parsed, never split on its separators.
- **A torn read reports absence.** A missing part yields `null` rather than a
  truncated value, so a caller re-authenticates instead of being handed half a
  credential.
- **Shrinking cleans up.** Surplus parts from a longer previous value are
  removed, or a later read would splice the old tail onto the new value.

`__specs__/secure-chunking.spec.ts` proves a realistic 4KB Supabase session
round-trips byte-for-byte across three chunks with its JWT still decoding.

## On MMKV

MMKV is the obvious future for `deviceStorage`: roughly 30x faster, synchronous,
and a swap that means reimplementing one file.

It is **not** a `secureStorage` replacement, despite having encryption. MMKV's
`encryptionKey` is a string you supply — it AES-encrypts the file, with no
keystore and no hardware backing. The key itself has to be persisted somewhere,
and that somewhere is the keystore. The library's own maintainer answers "can I
generate a random key?" with [_"How would you open the storage again?"_](https://github.com/mrousavy/react-native-mmkv/issues/330).

So the layered pattern is: MMKV holds encrypted bulk data, the OS keystore holds
the key, and the two never live in the same file. For a credential, straight
keystore storage is simpler and strictly stronger.

Adopt it when there is a real performance reason. Today `deviceStorage` holds a
small profile object and a locale string, where AsyncStorage's speed is
irrelevant and the native dependency is not free.
