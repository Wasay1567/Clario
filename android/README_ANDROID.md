# Madadgar (مددگار) — Native Android Application (Kotlin + Jetpack Compose)

This directory contains the complete, production-grade native Android codebase for **Madadgar**, built for the **Build4Better Hackathon 2026** at NED University Department of Software Engineering.

## Architecture Highlights
- **Jetpack Compose + Material 3:** Accessible high-contrast design, minimum 20sp body text, 28sp+ headlines, 56dp+ touch targets, bilingual Urdu/English.
- **Offline Data Support (Room Database):** Full offline persistence of help sessions and fraud verdicts using SQLite/Room (`MadadgarDatabase`, `HelpSessionDao`, `MessageCheckDao`).
- **Foreground Service Overlay (`FloatingBubbleService`):** Implements `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` for a draggable help bubble that floats over banking apps (JazzCash, Easypaisa) and forms.
- **ScreenCaptureService:** Secure `MediaProjection` bridge that takes a single on-demand screenshot with explicit user consent per invocation.
- **OfflineFraudDetector + SmsReceiver:** Instant on-device classification for Pakistani scams (BISP, fake 8171, JazzCash PIN/OTP phishing, fake parcel links).

## How to Open and Run in Android Studio
1. Open **Android Studio** (Koala / Ladybug or newer recommended).
2. Select **Open** and choose this `android/` directory.
3. Allow Gradle to sync dependencies (`Jetpack Compose BOM 2024.10`, `Material3 1.3.1`, `Room 2.6.1`).
4. Connect a physical Android 10+ device via USB (or start an emulator with Google Play Services).
5. Click **Run 'app'** (`Shift + F10`).

## Permissions Granted at Runtime
- `SYSTEM_ALERT_WINDOW`: Display over other apps for the floating bubble.
- `RECORD_AUDIO`: Microphone speech recording for problem descriptions.
- `RECEIVE_SMS` & `READ_SMS`: Live SMS scam shield.
- `FOREGROUND_SERVICE`: Keeping the assistant alive while navigating other apps.
