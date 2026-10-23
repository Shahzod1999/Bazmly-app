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
| `npm test` | Jest: API client, kirish oqimi, format, narx qatorlari |
| `npx expo export --platform ios --platform android` | Native JS bundle'ni yig'ish (tezkor kompilyatsiya tekshiruvi) |
| `npm run api:types` | `src/api/types.ts` ni backend OpenAPI sxemasidan qayta generatsiya qilish (`BACKEND_CONTRACT.md`) |
| `npm run smoke` | Backend smoke test: ~55 endpoint, javoblar `types.ts` ga solishtiriladi (pastga qarang) |

## Backend

Backend: [Patriotic20/bazmly-backend](https://github.com/Patriotic20/bazmly-backend) (FastAPI). Production: `https://bazmly-backend-production.up.railway.app`, Swagger `/api/docs`.

- Tiplar backend OpenAPI'dan generatsiya qilinadi (`npm run api:types`). Qo'lda tahrirlanmaydi.
- Kirish backend qaroriga ko'ra SMS kodsiz: telefon raqam va ixtiyoriy parol.
- Onlayn to'lov yo'q: bron `pending` holatida yaratiladi, muassasa tasdiqlaydi. Depozit joyida kelishiladi.
- Batafsil va backend uchun ochiq masalalar (push, suratlar yuklash): `BACKEND_CONTRACT.md`.

## Lokal backend bilan ishlash

Production'ga tegmasdan to'liq sinash uchun backend'ni lokal ishga tushiring (PostgreSQL 16 + PostGIS, Redis kerak; yoki `bazfind` monorepo'dagi `docker compose up`):

```bash
git clone https://github.com/Patriotic20/bazmly-backend && cd bazmly-backend
git am ../bazmly-app/backend-patches/0001-*.patch   # backend'ga hali qo'shilmagan bo'lsa (xodim paneli, chat, push)
cp .env.template .env        # CORS ga http://localhost:8081 ni qo'shing
uv sync && uv run alembic upgrade head
uv run python -m scripts.seed_demo     # demo: 10 venue, mijozlar, egalar, xodimlar, bronlar
uv run uvicorn app.main:app --port 8000
```

Ilovada: `.env` → `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000` (telefonda — kompyuterning lokal IP manzili).

Demo akkauntlar (parol hammasida `demo1234`):

| Rol | Kirish |
|---|---|
| Mijoz | `+998 90 000 01 01` … `01 06` |
| Muassasa egasi | `+998 90 000 00 11` (Bahor), `…00 14` (Sayqal va 3 ta to'yxona) |
| Xodim | telefon `+998 90 000 02 01` (menejer), `…02 02` (ofitsiant), `…02 03` (oshpaz) — Bahor Chilonzor; yoki login `bzmana201`, `bzwait202`, … ("Xodim sifatida kirish") |
| Admin | `+998 90 000 00 01` |

```bash
SMOKE_API_BASE_URL=http://localhost:8000 SMOKE_PHONE=+998900000101 SMOKE_PASSWORD=demo1234 \
  SMOKE_WRITE=1 SMOKE_VENUE_ID=1 npm run smoke
```

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
  (auth)/                # phone → password | register; name (pending_profile); staff-login
  (tabs)/                # Asosiy · Voucher · [Skaner] · Joylar · Profilim
  venue/[id]             # restoran ham, to'yxona ham (hall/[id] → redirect)
  book/hall/[id]         # to'yxona bron oqimi (bosqichli)
  book/table/[id]        # stol bron oqimi
  booking-success/, ticket/, scan, map, notifications, messages/, profile/ (password, ...), review/
  partner/(tabs)/        # Bosh · Bronlar · Menyu · Xodimlar · Sozlamalar
  partner/scan, partner/register, invite/[token]
src/api/                 # client (refresh mutex), types (web'dan aynan), types.pending, services, queries
src/features/            # ekranlararo bloklar (auth, booking, venues, tickets, partner, ...)
src/components/ui/       # UI kit (Button, Input, Sheet, PhoneInput, Skeleton, States, ...)
src/theme/, src/i18n/, src/stores/, src/lib/
docs/INVENTORY.md        # web → native xaritasi, web'da topilgan xatolar, ochiq savollar
docs/RELEASE.md          # EAS build, do'kon talablari, universal link'lar
BACKEND_CONTRACT.md      # backend dasturchi uchun yangi endpointlar spetsifikatsiyasi
```

Prompt'dagi `(customer)/` guruhi o'rniga mijoz ekranlari ildizda joylashgan. Sababi: deep link yo'llari (`/venue/12`, `/ticket/5`) qisqa bo'lishi kerak. Hamkor qismi `partner/` ostida va `PartnerGate` bilan himoyalangan.

## Brend

Asosiy rang `src/theme/tokens.ts` da bitta joyda: `#FF6B00` (web kodidan). Brend kitobidagi `#E85102` ga o'tish uchun faqat shu qiymat o'zgartiriladi. Splash va Android ikonka foni `app.config.ts` da.
