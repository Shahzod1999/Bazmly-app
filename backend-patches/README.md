# Backend uchun patch'lar

`bazmly-backend` (Patriotic20) repo'siga to'g'ridan-to'g'ri yozish huquqi yo'q. Shu sababli o'zgarishlar shu yerda `git format-patch` fayli sifatida turadi. Batafsil: `../BACKEND_CONTRACT.md` → "Backend uchun tayyor patch".

## 0001 — xavfsizlik, muassasa chati, xodim ish joyi, Expo push

Production'da hozir ochiq turgan ruxsat teshiklarini yopadi. Iloji boricha tezroq qo'llash kerak.

```bash
cd bazmly-backend
git checkout -b fix/tenant-scope-and-venue-chat origin/main
git am /path/to/bazmly-app/backend-patches/0001-*.patch
uv run pytest -q            # 236 passed
uv run ruff check app tests
```

Migratsiya kerak emas: yangi jadval yoki ustun yo'q.

Deploy'dan keyin Railway'da push yoqiladi:

```
APP_CONFIG__PUSH__PROVIDER=expo
# Expo loyihasida "Enhanced push security" yoqilgan bo'lsa:
APP_CONFIG__PUSH__EXPO_ACCESS_TOKEN=...
```

API'dagi o'zgarishlar:

- `/venue/...` dagi o'qish endpointlari endi chaqiruvchi shu filialda (yoki tarmoqda) ishlashini talab qiladi. Begona `venue_id` yoki `group_id` → 403.
- `GET /venue/orders/{id}/receipt` endi `venue_id` query parametrini talab qiladi.
- Yangi: `GET /venue/staff/me/workplaces`, `GET|POST /venue/conversations…`.
- `ConversationListItem` ga `venue_name` va `user_name` qo'shildi.
