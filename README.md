# Bazmly — mobil ilova (iOS + Android)

To'yxona va restoranlarni bron qilish platformasi Bazmly'ning native ilovasi. Ilova bitta: mijoz qismi va hamkor (venue egasi va xodimlar) paneli rolga qarab ochiladi.

**Stek:** Expo SDK 58 · React Native 0.88 · TypeScript (strict) · expo-router · TanStack Query · Zustand · i18next (uz/ru/en) · react-native-maps (Google) · expo-camera · expo-notifications · expo-secure-store · MMKV

## Ishga tushirish

```bash
npm install
cp .env.example .env
npx expo start            # web preview: w tugmasi; telefon uchun development build kerak (docs/RELEASE.md)
```

| Buyruq | Nima qiladi |
|---|---|
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint (React Compiler qoidalari bilan) |
| `npm test` | Jest: API client, OTP, karta, format, narx qatorlari |
| `npx expo export --platform ios --platform android` | Native JS bundle'ni yig'ish (tezkor kompilyatsiya tekshiruvi) |

## Mock rejim

Backend'da hali **SMS OTP** va **karta to'lovi** endpointlari yo'q. Ular `BACKEND_CONTRACT.md` da tavsiflangan. Hozir ilova ularni mock bilan ishlatadi:

- `EXPO_PUBLIC_MOCK_OTP=true` — SMS kod `111111`. Kirish mavjud `/auth/phone-check`, `/auth/login` va `/auth/register` endpointlari orqali bo'ladi.
- `EXPO_PUBLIC_MOCK_PAYMENTS=true` — karta va to'lov kodi `111111`. Karta faqat maskali ko'rinishda qurilmada saqlanadi.

Boshqa hamma narsa real backend'ga ulanadi: `https://bazmly-backend-production.up.railway.app`.

## Tuzilma

```
src/app/                 # ekranlar (expo-router)
  onboarding.tsx         # til + slaydlar
  (auth)/                # phone → otp → name; staff-login
  (tabs)/                # Asosiy · Voucher · [Skaner] · Joylar · Profilim
  venue/[id]             # restoran ham, to'yxona ham (hall/[id] → redirect)
  book/hall/[id]         # to'yxona bron oqimi (bosqichli)
  book/table/[id]        # stol bron oqimi
  payment/, payment-success/, ticket/, scan, map, notifications, messages/, profile/, review/
  partner/(tabs)/        # Bosh · Bronlar · Menyu · Xodimlar · Sozlamalar
  partner/scan, partner/register, invite/[token]
src/api/                 # client (refresh mutex), types (web'dan aynan), types.pending, services, queries
src/features/            # ekranlararo bloklar (booking, payments, venues, tickets, partner, ...)
src/components/ui/       # UI kit (Button, Input, Sheet, OTPInput, PhoneInput, Skeleton, States, ...)
src/theme/, src/i18n/, src/stores/, src/lib/
docs/INVENTORY.md        # web → native xaritasi, web'da topilgan xatolar, ochiq savollar
docs/RELEASE.md          # EAS build, do'kon talablari, universal link'lar
BACKEND_CONTRACT.md      # backend dasturchi uchun yangi endpointlar spetsifikatsiyasi
```

Prompt'dagi `(customer)/` guruhi o'rniga mijoz ekranlari ildizda joylashgan. Sababi: deep link yo'llari (`/venue/12`, `/ticket/5`) qisqa bo'lishi kerak. Hamkor qismi `partner/` ostida va `PartnerGate` bilan himoyalangan.

## Brend

Asosiy rang `src/theme/tokens.ts` da bitta joyda: `#FF6B00` (web kodidan). Brend kitobidagi `#E85102` ga o'tish uchun faqat shu qiymat o'zgartiriladi. Splash va Android ikonka foni `app.config.ts` da.
