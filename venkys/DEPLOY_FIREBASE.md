# Deploying to Firebase Hosting

Follow these steps to deploy the Vite + React + Firebase app.

## 1. Install dependencies
```
npm install
```

## 2. Login to Firebase
```
npx firebase login
```

## 3. Set your project ID
Edit `.firebaserc` and replace `YOUR_FIREBASE_PROJECT_ID` with the actual ID from the Firebase console (Project settings > Project ID). Example:
```json
{
  "projects": { "default": "venkys-mealz" }
}
```

Alternatively set it just-in-time:
```
set FIREBASE_PROJECT=venkys-mealz
```
(but .firebaserc is simpler.)

## 4. (Optional) Initialize (if you add more products later)
If you ever need to re-run init for functions/storage/emulators:
```
npx firebase init
```
Skip Hosting overwrite unless you intend to change it.

## 5. Build
```
npm run build
```
This produces the production bundle in `dist/`.

## 6. Deploy
```
npm run deploy
```
That runs `vite build` then:
```
npx firebase deploy --only hosting
```

## 7. SPA Rewrite
The `firebase.json` already rewrites all routes to `/index.html` so React Router works on refresh/deep links.

## 8. Environment Variables
Your `src/lib/firebase.js` expects the following Vite env vars (in a `.env` file or set in shell before build):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
Create `.env` (not committed) for local, and configure the same values in Firebase Hosting via:
```
npx firebase hosting:channel:deploy preview --expires 7d
```
(for previews) or use `.env` at build time in your CI.

For production with CI you can store them as build secrets and inject before `npm run build`.

## 9. Cache / Performance Tweaks (Optional)
You can add headers in `firebase.json` later:
```json
"headers": [
  { "source": "**/*.js", "headers": [{ "key": "Cache-Control", "value": "public,max-age=31536000,immutable" }] },
  { "source": "index.html", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
]
```
Remember to bump file hashes (Vite already hashes for you).

## 10. Rollbacks
List deploys:
```
npx firebase hosting:versions:list
```
Rollback:
```
npx firebase hosting:versions:clone <PREVIOUS_VERSION_ID> live
```

## 11. Multi-Environment (Optional)
Add more targets in `.firebaserc` (e.g. `staging`) and define another site in Firebase console, then deploy with:
```
npx firebase deploy --only hosting:staging
```

---
Deployment is ready. Replace the placeholder project ID and run the commands above.
