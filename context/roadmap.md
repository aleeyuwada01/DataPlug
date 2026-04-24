# Project Roadmap & Future Implementation

## Remaining Tasks

### 1. Payment & Wallet (Completed)
- [x] **Flutterwave Integration**: Bank Transfer, USSD, and OPay.
- [x] **Webhook Reconciliation**: Secure server-side wallet credit.
- [x] **Premium Loading**: Skeleton rows for banks and balances.

### 2. Functional Features (Next Steps)
- **Data/Airtime Provider Integration**: Connect the purchase flow to a real VTU API (e.g., ClubKonnect, VTpass, or similar).
- **Contact Integration**: Use `expo-contacts` to allow users to select phone numbers from their phonebook.
- **Push Notifications**: Configure `expo-notifications` for transaction alerts and reward reminders.

### 3. Production & Deployment
- [ ] **Render Deployment**: Finalize backend hosting and environment variables.
- [ ] **EAS Build**: Generate production `.apk` and `.aab` files.
- [ ] **Domain Setup**: Connect custom domain for the API.

### 4. Polish & Security
- **Receipt PDF**: Convert the currently static receipt modal into a downloadable/shareable PDF using `expo-print` or `expo-sharing`.
- **Profile Functionality**: Connect "Edit Profile" and "Settings" to persistent storage.
- **Biometric Auth**: Implement FaceID/Fingerprint for transaction confirmation.
