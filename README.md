# Smart Classroom IoT App

A React Native Expo app replicating the Smart Classroom IoT Control dashboard.

## Requirements
- Node.js 18+
- Expo CLI
- Expo Go app (SDK 55.0.5) on your phone

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the Expo dev server
npx expo start

# 3. Scan the QR code with your Expo Go app
```

## Features
- 📊 Live-simulated sensor data (updates every 2.5s)
- 🌡 Temperature, light level, gas PPM readings
- 👥 Student count with trend indicator
- 🚨 Send Alert modal (Fire / Earthquake / Gas)
- ✅ Clear Alert button
- 📡 Motion & Noise detection with pulse animation
- 🎓 Classroom Mode selector (Quiet / Lecture / Exam)
- 🔴 Top alert banner with slide-in animation
