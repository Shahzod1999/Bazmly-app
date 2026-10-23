# Bosqich 0 — Web loyiha inventarizatsiyasi

> **Tarixiy hujjat (2026-10-22).** Keyin ilova haqiqiy backend'ga (Patriotic20/bazmly-backend) moslandi: SMS/OTP va onlayn to'lov backend qarori bilan olib tashlangan, tiplar OpenAPI'dan generatsiya qilinadi. Joriy holat: `BACKEND_CONTRACT.md`.

Manba: `bazmly` (Next.js 16.2 + React 19.2 + Tailwind v4), ~17 600 qator, 10 ta route, 9 ta API servis, `types.ts` (~1100 qator, backend OpenAPI'ga mos).
Web ekranlar skrinshotlari soxta API javoblari bilan olindi (backend konteynerdan ochilmaydi) — `docs/web-reference/`.

## Ekranlar → native mosligi

| Web route | Native route | Holatlar | API |
|---|---|---|---|
| `/` (page.tsx) | `src/app/(tabs)/index.tsx` | loading, empty, error, guest | `venues/search`, `regions`, `regions/{id}/districts`, `districts/nearest`, `users/me/recent-locations`, `favorites`, `notifications`, `notifications/unread-count` |
| `/venue/[id]` | `src/app/venue/[id].tsx` | loading, 404, error | `venues/{id}`, `venues/{id}/menu`, `venues/{id}/reviews`, `reviews/venue/{id}/aggregate`, `favorites`, `conversations` |
| `/toyxona/[id]` + `toyxona-flow-modal` | `src/app/hall/[id].tsx`, `src/app/book/hall/[id].tsx` | bosqichli wizard | `venues/{id}/availability`, `venues/{id}/services`, `bookings/hall` |
| `/booking/[id]` | `src/app/book/table/[id].tsx` | bosqichli wizard | `venues/{id}/zones`, `venues/{id}/tables`, `bookings/table` |
| `/payment/[id]` | `src/app/payment/[bookingId].tsx` | kartalar, OTP, jarayon | **yo'q** → BACKEND_CONTRACT §2 (mock) |
| `/payment-success` | `src/app/payment-success/[bookingId].tsx` | — | `bookings/{id}` |
| `/tickets` | `src/app/(tabs)/vouchers.tsx`, `src/app/ticket/[bookingId].tsx` | empty | `bookings`, `bookings/{id}` |
| `/feed` | `src/app/(tabs)/places.tsx` | faol/o'tgan, empty | `bookings`, `bookings/{id}/cancel` |
| `/login` (3879 qator: onboarding + auth + profil) | `src/app/onboarding.tsx`, `src/app/(auth)/*`, `src/app/(tabs)/profile.tsx`, `src/app/profile/*` | ko'p modal | `auth/*`, `users/me`, `languages`, `users/me/friends*`, `conversations` |
| `/admin` | `src/app/partner/(tabs)/*`, `src/app/partner/scan.tsx` | 5 tab | `venue/*` (groups, venues, bookings, analytics, menu, staff, orders/table-board) |
| bottom-nav (Skaner) | `src/app/(tabs)/_layout.tsx` + `src/app/scan.tsx` | permission → scanning → my_qr | — |

## Web'dagi xatolar va kamchiliklar (native'da tuzatildi)

0. **KRITIK — soxta bron** (`booking/[id]/page.tsx`): `bookHall`/`bookTable` xato qaytarsa, web tasodifiy ID bilan `status: "confirmed"` bron yasab, `localStorage`ga yozadi va foydalanuvchiga "Band qilish tasdiqlandi" ko'rsatadi. Mijoz zalni band qildim deb o'ylaydi, aslida backend'da bron yo'q. Native'da xato foydalanuvchiga ko'rsatiladi, hech qanday soxta bron yaratilmaydi. **Web versiyada ham tezda tuzatish kerak.**
0.2. **KRITIK — avtomatik soxta akkaunt** (`admin/page.tsx` ~200-qator): token bo'lmasa `+99890XXXXXXX` tasodifiy raqam va `Password123!` paroli bilan foydalanuvchi ro'yxatdan o'tkaziladi, keyin hardcode ma'lumotli "Mumtoz Saroyi" guruhi va filiali (`district_id: 1`, Amir Temur ko'chasi 12) yaratiladi. Har bir mehmon kirishi backend'da axlat akkaunt va muassasa qoldiradi.
0.3. **Hamkor ro'yxatdan o'tishi xatolarni yutadi** (`login/page.tsx` ~950): `register` va `createVenue` xatolari `catch {}` bilan yashiriladi, default parol `Partner123!`, koordinata hardcode — foydalanuvchi baribir `/admin` ga yuboriladi. Native: barcha xatolar ko'rsatiladi, parol/koordinata hardcode yo'q.
0.1. Web'da bron sanasi faqat joriy oyning kuni sifatida yig'iladi (`${year}-${month}-${selectedDate}`) — keyingi oyga bron qilib bo'lmaydi. Native: to'liq kalendar.

1. **Token refresh osilib qolishi** — `config.ts`: refresh muvaffaqiyatsiz bo'lsa navbatdagi so'rovlar hech qachon resolve bo'lmaydi. Native: bitta umumiy `refreshPromise`, xatoda hammasi 401 bilan qaytadi va sessiya tozalanadi.
2. **Soxta muvaffaqiyat** — `partnerService.createMenuItem` 404 xatosida `id: 0` bilan "yaratildi" deb qaytarar edi. Olib tashlandi.
3. **`listCategories` default `group_id = 1`** — boshqa hamkorning ma'lumoti so'ralishi mumkin edi. Native'da group id majburiy.
4. **`saveRecentLocation` qo'lda tanlanganda Toshkent koordinatasi** (41.2995, 69.2401) hardcode qilingan. Native: tuman koordinatasi ishlatiladi.
5. **Hardcode ma'lumotlar real ekranlarda**: "The Royal Grand", "Navoiy, O'zbekiston ko'chasi 27", "25,000,000 so'm", "4.8 (356 ta sharh)", sana `2026-06-18`, "15,000,000 UZS", haftalik grafik `13/75/68/...`, `MOCK_VENUES`. Native'da faqat API ma'lumoti.
6. **To'lov formasida CVV** — UzCard/Humo'da CVV yo'q (SMS orqali tasdiqlanadi). Native'da olib tashlandi.
7. **Inglizcha matnlar** o'zbekcha UI ichida ("Hall Rental Fee", "Detailed Price Report", "Edit profile", "Add friends", "Total Amount Payable"). Hammasi i18n kalitlariga o'tkazildi.
8. **Legacy `localStorage` sinxronizatsiyasi** (`isRegistered`, `fullName`, `userRole`) — ko'chirilmadi; yagona manba: auth store + `GET /users/me`.
9. **Telegram'ga bog'liq kirish** (`initData`) — native'da ishlamaydi; SMS OTP bilan almashtirildi.
10. **Bron sana/vaqt tanlash** web'da qat'iy ro'yxat (`Chor..Yak`, `22:30..00:00`). Native: haqiqiy kalendar + availability API.

## Backend'da yo'q, lekin kerak bo'lgan endpointlar

- SMS OTP (`/auth/otp/send`, `/auth/otp/verify`) — §1
- Karta saqlash va depozit to'lovi (`/payments/*`, `/bookings/{id}/deposit`) — §2
- Venue suratlarini yuklash (`/venue/venues/{id}/photos`) — §4 (taklif)
- Promokod/voucher ro'yxati (`/vouchers`) — §5 (taklif; web'da faqat hardcode)

Batafsil: `BACKEND_CONTRACT.md`.

## Ochiq savollar

1. Brend rangi: `#FF6B00` (web kodi) yoki `#E85102` (brend kitob)? Hozir `#FF6B00`, `src/theme/tokens.ts` da bitta joyda.
2. Deep link domeni: `bazmly.uz` tasdiqlanganmi? (`APP_DOMAIN` env)
3. Bekor qilish siyosati va depozit qaytarilishi — matn kim tomonidan beriladi?
4. Push: backend Expo Push API'ni ishlatadimi yoki FCM/APNs to'g'ridan-to'g'ri? (`EXPO_PUBLIC_PUSH_TOKEN_KIND`)
5. Maxfiylik siyosati va foydalanish shartlari URL'lari (App Store talabi).
