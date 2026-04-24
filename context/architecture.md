# Project Architecture & Structure

## Directory Layout
The project follows the **Expo Router** convention for file-based routing and a modular component structure.

- `app/`: Contains the application screens and routing logic.
    - `(tabs)/`: Tab-based navigation for the main dashboard (Home, History, Rewards, Cards, Profile).
    - `_layout.tsx`: Root layout, theme provider wrapper, and initial redirect logic.
    - `welcome.tsx`: First-time user landing screen.
    - `onboarding.tsx`: Registration flow (Phone, OTP, Password).
    - `login.tsx`: User authentication screen.
- `components/`: Reusable UI components.
    - `GlassCard.tsx`: A specialized component for glassmorphism effects.
    - `CheckInBanner.tsx`: Daily reward interaction component.
    - `RewardProgress.tsx`: Visual progress tracker for rewards.
- `constants/`: Configuration and design tokens.
    - `theme.ts`: Central source for colors, spacing, typography, and gradients.
- `contexts/`: React Context providers.
    - `ThemeContext.tsx`: Manages Light/Dark mode state and provides theme tokens.
- `hooks/`: Custom React hooks.
    - `useAppHaptic.ts`: Unified hook for haptic feedback.
- `server/`: Express backend (TypeScript).
    - `src/routes/`: API endpoints (auth, wallet, transactions).
    - `src/services/`: External integrations (Flutterwave, Termii).
- `services/`: Frontend API client.
    - `api.ts`: Centralized `ApiClient` with error handling and environment-aware base URLs.
- `assets/`: Static assets (images, fonts).

## Navigation Logic
1. **Bootstrap**: Upon launch, `app/_layout.tsx` checks session state and redirects to `/welcome` if it's a new session.
2. **Onboarding**: `/welcome` -> `/onboarding` (multi-step flow).
3. **Authentication**: `/login` leads to the main `(tabs)` dashboard.
4. **Main App**: Uses a Bottom Tab navigator for core features.

## Payment Architecture (Flutterwave)
- **Dynamic Funding**: Initiates a charge request to Flutterwave, returns a virtual account or USSD string.
- **Orchestrator Flow (V2)**: Uses the Customer-PaymentMethod-Charge sequence for OPay and USSD to ensure maximum compatibility and properly formatted instructions.
- **Webhook Reconciliation**: The server listens for `charge.completed` events, verifies the payload authenticity, and atomically updates the user's balance in the PostgreSQL database.

## Styling Approach
The project uses **React Native StyleSheet** combined with a custom **Design System**. 
- We prioritize **dynamic styles** by fetching `Colors` and `Gradients` from the `useTheme()` hook.
- Standard spacing and typography tokens are imported from `constants/theme.ts`.
- **Skeleton Loading**: Implements custom `Animated` pulse effects for asynchronous data states.
