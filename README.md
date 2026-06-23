# HouseMajor — Mobile App

The mobile version of HouseMajor, a Rwanda genocide testimony and memorialization platform. Built with **Expo SDK 56 / Expo Router**.

## Stack

- **Expo SDK 56** — file-based routing via Expo Router
- **React Native Reanimated v4** — enter/exit animations
- **expo-secure-store** — JWT persisted to iOS Keychain / Android Keystore
- **axios** — API client with request/response interceptors + 401 auto sign-out
- **expo-image** — optimized image loading
- **expo-symbols** — SF Symbols on iOS, Material icons on Android

Backend: NestJS API on Railway → `https://storybook-api-production.up.railway.app`

## Project Structure

```text
src/
├── app/
│   ├── (auth)/            # Login, Sign-up, Forgot Password
│   ├── (tabs)/            # Home feed, Explore, Create, Profile
│   └── testimony/[id]     # Testimony detail (root-level stack)
├── components/
│   ├── ui/                # Reusable: AppButton, AppInput, ScreenHeader, EmptyState
│   ├── testimony-card     # Feed card (regular + featured hero variant)
│   └── app-tabs           # NativeTabs with SF Symbol icons
├── services/
│   ├── api.ts             # axios instance, SecureStore helpers, 401 handler
│   ├── auth.service.ts    # login, register, getProfile, forgotPassword
│   └── testimony.service.ts
├── context/auth.tsx       # AuthProvider — session restore, signIn/signUp/signOut
├── types/testimony.ts     # Full TypeScript types matching backend
└── constants/theme.ts     # shadcn-style HSL tokens for light + dark
```

## Phases

### Phase 1 — Auth + Navigation

- Login + Sign-up with focus rings, ref-chained inputs, spring animations
- JWT saved to SecureStore; session restored on launch via `GET /auth/profile`
- Bottom tabs: Home, Explore, Create, Profile (SF Symbols + Material icons)
- Auto redirect based on auth state; loading guard prevents flash

### Phase 2 — Testimonies Feed + Detail

- Home feed: `FlatList` with pull-to-refresh, infinite scroll, filter chips, debounced search
- First card rendered as a featured hero (larger image + more excerpt lines)
- Testimony detail: hero image, type badge, author card, location/date chips, full testimony, audio/video duration card, relatives list, image gallery

### Phase 3 — Explore + Create Testimony

- Explore: live search (450ms debounce), trending horizontal scroll, browse-by-type cards
- Create: 4-step wizard — type selection → event details → testimony text → identity preference → `POST /testimonies`
- Written testimonies now; audio/video marked coming soon

### Phase 4 — Reusable Components + Forgot Password + Edit Profile *(current)*

- `AppButton`, `AppInput`, `ScreenHeader`, `EmptyState` shared components
- All screens refactored for consistent UI/UX
- Forgot password flow (`POST /auth/forgot-password`)
- Edit profile + My testimonies from profile screen

## Auth Flow

```text
Launch → SecureStore.getItemAsync()
  ├── token found → GET /auth/profile → restore user → tabs
  └── no token / 401 → clear token → login screen

Login/Sign-up → POST /auth/login|register
  └── save access_token (JWT, 24h expiry) → redirect to tabs

Any API call returns 401 (token expired mid-session)
  └── removeToken() + setUser(null) → auto redirect to login
```

## Running Locally

```bash
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android, `w` for web.
