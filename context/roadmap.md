# Project Roadmap & Future Implementation

## Remaining Tasks

### 1. Backend Integration (High Priority)
- **Firebase Auth**: Replace mock login/signup logic with actual Firebase Authentication.
- **Firestore**: Implement real-time listeners for user balance, transaction history, and reward points.
- **Daily Claims**: Connect the daily check-in feature to a database-backed timestamp system.

### 2. Functional Features
- **Data/Airtime Purchase**: Implement the selection logic and connect it to a payment gateway/API provider.
- **Contact Integration**: Use `expo-contacts` to allow users to select phone numbers from their phonebook.
- **Push Notifications**: Configure `expo-notifications` for transaction alerts and reward reminders.

### 3. File Exports
- **Receipt PDF**: Convert the currently static receipt modal into a downloadable/shareable PDF using `expo-print` or `expo-sharing`.

### 4. Polish
- **Profile Functionality**: Connect "Edit Profile" and "Settings" to persistent storage.
- **Security**: Implement Biometric Auth (FaceID/Fingerprint) for transaction confirmation.
