# Reliz: telefonda sinash → App Store / Google Play

Barcha build'lar EAS'da (Expo bulutida) yig'iladi. Mac yoki Android Studio kerak emas.

## 0. Bir martalik sozlash

```bash
npm install
npx eas-cli@latest login            # expo.dev akkaunti
npx eas-cli@latest init             # EAS_PROJECT_ID beradi → .env ga yozing
cp .env.example .env                # qiymatlarni to'ldiring
```

Maxfiy qiymatlarni EAS'ga yuklang. Ular repoga tushmaydi:

```bash
npx eas-cli@latest env:create --name GOOGLE_MAPS_IOS_KEY --value ... --environment production --visibility secret
npx eas-cli@latest env:create --name GOOGLE_MAPS_ANDROID_KEY --value ... --environment production --visibility secret
npx eas-cli@latest env:create --name EAS_PROJECT_ID --value ... --environment production --visibility plaintext
```

Google Maps kalitlari: Google Cloud Console → **Maps SDK for iOS** va **Maps SDK for Android** yoqiladi. Android kalitini paket nomi va SHA-1 bilan cheklang (SHA-1: `eas credentials` → Android → Keystore).

## 1. Telefonda sinash (development build)

Ilovada Google Maps, kamera, push va MMKV bor, shuning uchun **Expo Go ishlamaydi**. Development build kerak.

```bash
# Android — .apk yig'iladi, QR orqali telefonga o'rnatiladi
npx eas-cli@latest build --profile development --platform android

# iOS — qurilmani ro'yxatdan o'tkazish (bir marta), keyin build
npx eas-cli@latest device:create
npx eas-cli@latest build --profile development --platform ios

# Build o'rnatilgach, kompyuterda dev server:
npx expo start --dev-client
```

Barcha build'lar real backend'ga ulanadi (`EXPO_PUBLIC_API_BASE_URL`). Mock rejim yo'q.

Jamoaga tarqatish uchun: `--profile preview` (o'rnatiladigan ilova, dev serversiz).

## 2. Production

Talablar:
1. Backend'ga `backend-patches/` dagi patch qo'llangan bo'lishi kerak (`BACKEND_CONTRACT.md` → "Backend uchun tayyor patch"). U xavfsizlik teshiklarini yopadi, muassasa chati va xodimlar panelini ishga tushiradi.
2. Backend'da `APP_CONFIG__PUSH__PROVIDER=expo` o'rnatilgan bo'lishi kerak. Aks holda push faqat logga yoziladi va mijozlar bron tasdiqlanganini bilmaydi.
3. Domen (`APP_DOMAIN`, standart `bazmly.uz`) tasdiqlangan bo'lishi va universal link fayllari joylangan bo'lishi kerak:
   - `https://bazmly.uz/.well-known/apple-app-site-association`
   - `https://bazmly.uz/.well-known/assetlinks.json`
   Fayllar namunasi pastda.

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production --platform ios
npx eas-cli@latest submit --profile production --platform android
```

`eas.json` dagi `ascAppId` ni App Store Connect'dagi ilova ID'si bilan almashtiring. Google Play uchun xizmat akkaunti kalitini `secrets/google-play-service-account.json` ga qo'ying (u `.gitignore` da).

## 3. Do'kon talablari — tekshiruv ro'yxati

| Talab | Holat |
|---|---|
| Akkauntni ilova ichida o'chirish (Apple 5.1.1(v)) | ✅ Profil → Akkauntni o'chirish (`DELETE /users/me`) |
| Ruxsat matnlari (kamera, joylashuv, galereya) — sababi bilan | ✅ `app.config.ts`, `native-locales/*.json` (uz/ru/en) |
| Maxfiylik siyosati URL | ⏳ Saytda sahifa kerak; App Store Connect va Play Console'ga kiritiladi |
| Reviewer uchun demo akkaunt | ⏳ Backend'da test raqam va parol bilan akkaunt (masalan `+998 90 000 00 00`) yarating va "App Review Information" ga yozing |
| Play Console: Data safety formasi | ⏳ To'planadi: telefon, ism, joylashuv (taxminiy), qurilma ID, to'lov ma'lumoti (provayder orqali) |
| Shifrlash e'loni | ✅ `ITSAppUsesNonExemptEncryption: false` |
| Hamkor qismi | Reviewer'ga hamkor akkaunti ham bering (xodim login + parol), aks holda "yashirin funksiya" deb rad etilishi mumkin |
| Ikonka / splash | ⏳ `assets/icon.png` (1024×1024, shaffofsiz), `assets/splash-icon.png`, `assets/android-icon-*.png` ni yakuniy logo bilan almashtiring |

## 4. Universal link fayllari

`apple-app-site-association` (kengaytmasiz, `Content-Type: application/json`):

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["<TEAM_ID>.uz.bazmly.app"],
        "components": [
          { "/": "/venue/*" }, { "/": "/hall/*" }, { "/": "/ticket/*" }, { "/": "/invite/*" }
        ]
      }
    ]
  }
}
```

`assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "uz.bazmly.app",
    "sha256_cert_fingerprints": ["<PLAY APP SIGNING SHA-256>"]
  }
}]
```

## 5. Versiya

`appVersionSource: remote` — build raqamlari EAS'da avtomatik oshadi. Foydalanuvchiga ko'rinadigan versiya `app.config.ts` → `version`.
