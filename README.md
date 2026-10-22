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
| `npm run smoke` | Backend smoke test: ~60 endpoint, javoblar `types.ts` ga solishtiriladi (pastga qarang) |

## Mock rejim

Backend'da hali **SMS OTP** va **karta to'lovi** endpointlari yo'q. Ular `BACKEND_CONTRACT.md` da tavsiflangan. Hozir ilova ularni mock bilan ishlatadi:

- `EXPO_PUBLIC_MOCK_OTP=true` — SMS kod `111111`. Kirish mavjud `/auth/phone-check`, `/auth/login` va `/auth/register` endpointlari orqali bo'ladi.
- `EXPO_PUBLIC_MOCK_PAYMENTS=true` — karta va to'lov kodi `111111`. Karta faqat maskali ko'rinishda qurilmada saqlanadi.

Boshqa hamma narsa real backend'ga ulanadi: `https://bazmly-backend-production.up.railway.app`.

## Backend smoke test

`npm run smoke` web va mobil ilova ishlatadigan endpointlarni chaqiradi. Har bir javobni `src/api/types.ts` dagi tipga solishtiradi; sxemalar har safar shu fayldan avtomatik generatsiya qilinadi.

```bash
# .env ga test akkaunt ma'lumotlarini yozing (.env.example dagi SMOKE_* qatorlar)
npm run smoke                       # natija terminalda
npm run smoke -- --json report.json # backend dasturchiga yuborish uchun
```

| Belgi | Ma'nosi |
|---|---|
| ✓ | Status va javob shakli to'g'ri |
| ✗ | Kutilmagan status, majburiy maydon yo'q yoki tip mos emas (masalan, `price` string o'rniga number) |
| ⚠ | Javobda `types.ts` da yo'q yangi maydon bor (tiplarni yangilash kerak) yoki javob 2 soniyadan sekin |
| ⏳ | `BACKEND_CONTRACT.md` dagi endpoint hali chiqarilmagan |
| – | O'tkazib yuborildi (masalan, akkaunt berilmagan) |

- Standart rejim faqat o'qiydi.
- `SMOKE_WRITE=1` bo'lsa, sevimlilarga qo'shib-olib tashlaydi, 7 kundan keyingi sanaga stol bronini yaratib, darhol bekor qiladi. Bu rejim faqat `SMOKE_VENUE_ID` (test venue) berilganda ishlaydi.
- Xato bo'lsa chiqish kodi `1`, backend umuman javob bermasa `2`. Shuning uchun skriptni CI'ga ham qo'yish mumkin.

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
