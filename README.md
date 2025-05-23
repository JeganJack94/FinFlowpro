# Finflow

Finflow is a mobile-first Progressive Web App (PWA) for tracking personal finances, including income, expenses, liabilities, and savings. Built with React, Vite, TypeScript, Tailwind CSS, and Firebase, it offers real-time syncing, offline capability, and secure authentication.

## 🚀 Features

- **Mobile-First & PWA:** Installable on any device, works offline, and feels like a native app.
- **Real-Time Sync:** All your data is instantly updated across devices using Firestore.
- **Secure Authentication:** Sign up and sign in with Firebase Auth.
- **Modern UI:** Built with React, Vite, and styled using Tailwind CSS.
- **Financial Tools:** Track transactions, set goals, view analytics, and manage your profile.

## 🔗 Live Demo

[https://fin-flowai.vercel.app/](https://fin-flowai.vercel.app/)

## 📱 How to Install as a PWA

- **Android (Chrome):** Open the link, tap the three-dot menu, select "Add to Home screen," then tap "Add."
- **iPhone (Safari):** Open the link, tap the Share icon, select "Add to Home Screen," then tap "Add."
- **Desktop:** Open the link, look for the install icon in the address bar or browser menu, and click "Install."

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Firebase Auth
- **Database:** Firestore

## 📁 Project Structure

- `src/pages/` — Main app pages (Home, Analytics, Goals, Notifications, Profile, Auth)
- `src/components/` — Reusable UI components
- `src/contexts/` — React context providers (Auth, Finance)
- `src/services/` — Firebase service logic
- `public/` — PWA manifest, icons, and static files

## 🧑‍💻 Getting Started

1. **Clone the repo:**
   ```sh
   git clone <repo-url>
   cd FinFlow_Ui
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up Firebase:**
   - Create a Firebase project.
   - Add your Firebase config to `src/firebase.ts` and `src/services/firebase.ts`.
4. **Run the app locally:**
   ```sh
   npm run dev
   ```
5. **Build for production:**
   ```sh
   npm run build
   ```

## 🧩 Linting & Code Quality

- ESLint is configured for React, TypeScript, and recommended plugins.
- Example config for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

## 📝 User Manual

See `UserManual.md` for a detailed guide on using and installing Finflow.

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📧 Support

For help or feedback, use the app’s support section or email support@finflow.com.

---

Enjoy managing your finances with Finflow!
