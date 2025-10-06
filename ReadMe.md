
scroll down for BG
# Scan&Serve — QR Menu PWA (Firebase)

> **Short description:** A PWA for restaurant menus with real-time ordering. Guests scan a table QR code and place an order; the Admin/KDS screen sees orders live and updates statuses. Stack: React + Vite, Tailwind CSS, Firebase (Auth, Firestore, Functions, Storage, Hosting, FCM). Payments are **optional** via a per-restaurant on/off flag.

* **Recommended repo name:** `qrmenu-pwa-firebase`
* **Product (brand) name:** **Scan&Serve**

---

## ✨ Key Features

* **QR → Table Menu:** static QR codes per table, format:
  `https://app.domain/menu?rid=R123&table=T7`
* **PWA / Add to Home Screen:** offline cache for menu, fast start, icons, splash.
* **Guest ordering:** categories, search, cart, item notes, submit order.
* **Real time (Firestore):** new orders instantly appear in Admin/KDS.
* **Order statuses:** `Received → In progress → Ready → Served` (+ `Canceled`).
* **Order numbering:** per table and day (e.g., `T7-012`).
* **Admin notifications:** Firebase Cloud Messaging (browser/phone) on new orders.
* **Admin/KDS screen:** filters by table/status, sound/vibration on new order, quick actions, history.
* **Media:** Firebase Storage; optional automatic optimization/resizing.
* **Payments (optional):** pluggable integration (e.g., Stripe), **on/off via setting** per restaurant.
* **Internationalization (i18n):** ready for BG/EN.
* **Accessibility:** contrast, keyboard navigation, ARIA roles.

---

## 🧱 Tech Stack

* **Frontend:** React + Vite, TypeScript, Tailwind CSS, React Router, `vite-plugin-pwa` (Service Worker + `manifest.webmanifest`).
* **Firebase:** Authentication *(anonymous sign-in for guests + email/password for admin)*, **Firestore** (real time), **Cloud Functions** (validation, numbering, webhooks), **Cloud Storage** (images), **Hosting**, **FCM** (push notifications).

---

## 🗺️ High-Level Architecture

```
Client (PWA) ───(QR URL)───> /menu?rid=...&table=...
      │            │
      │            ├─> Firestore (menu, orders - live)
      │            ├─> Storage (images)
      │            └─> Cloud Functions (validation, numbering, payments, FCM)
      │
      └─> FCM (push notifications to Admin/KDS)

Admin/KDS (web/PWA) ──> Firestore (subscribe /orders) ──> UI statuses + sound/alerts
```

---

## 🗂️ Project Structure

> You can ship **one app** with an `/admin` route **or** two separate Vite apps. Below shows two.

```
qrmenu-pwa-firebase/
├─ apps/
│  ├─ web/                 # guest PWA (React + Vite)
│  └─ admin/               # admin/KDS SPA (React + Vite)
├─ functions/              # Firebase Cloud Functions (TypeScript)
├─ tools/                  # helper scripts (e.g., QR generator)
├─ firestore.rules         # security rules
├─ storage.rules           # Storage rules
├─ firebase.json           # Hosting/Emulators config
├─ .firebaserc
└─ README.md
```

---

## 🗃️ Data Model (Firestore)

**URL scheme:** `/menu?rid=R123&table=T7`

**Top level:**

```
restaurants/{rid}
  name: string
  currency: "BGN" | "EUR" | ...
  logoUrl: string
  settings: {
    serviceFeePct: number | null
  }
```

**Menu:**

```
restaurants/{rid}/categories/{categoryId}
  name: string
  position: number

restaurants/{rid}/menuItems/{itemId}
  name: string
  description: string
  price: number          # in the smallest currency unit or decimal
  imagePath: string      # path in Storage (not a direct URL)
  imageUrl: string       # public URL (optional)
  categoryId: string
  tags: string[]
  available: boolean
  updatedAt: timestamp
```

**Counters & Orders:**

```
restaurants/{rid}/counters/{YYYY-MM-DD}
  tableCounters: { [tableId: string]: number }  # daily increment per table

restaurants/{rid}/orders/{orderId}
  orderNumber: string           # e.g., "T7-012"
  table: string                 # e.g., "T7"
  sessionId: string             # == guest's Firebase Auth UID (anonymous)
  status: "received" | "in_progress" | "ready" | "served" | "canceled"
  items: [
    { itemId, nameSnap, priceSnap, qty, notes }
  ]
  totals: {
    subtotal: number,
    service: number,
    grand: number
  }
  paid: boolean
  payment: {
    method: "cash" | "card" | "online" | null,
    provider: "stripe" | "none" | null,
    status: "pending" | "paid" | "failed" | null
  }
  createdAt: timestamp
  updatedAt: timestamp
```

**Payments settings (toggle):**

```
restaurants/{rid}/settings/payments
  enabled: boolean               # default false
  provider: "none" | "stripe"    # default "none"
  currency: "BGN" | "EUR" | ...
  testMode: boolean              # default true
```

> **Notes:**
>
> * Store `nameSnap`/`priceSnap` in `items[]` so order history doesn’t change when menu prices are edited.
> * `sessionId` = **anonymous Firebase Auth UID** → makes “only my orders” rules straightforward.

**Indexes (minimum):**

* Composite: `(status, createdAt desc)`
* Composite: `(table, createdAt desc)`

---

## 🔐 Firestore Rules (skeleton)

Require **Anonymous Auth** for the guest PWA.
Admin/KDS uses a custom claim per `rid`.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin(rid) {
      // custom claims: { rids: { [rid]: "admin" | "kds" } }
      return isSignedIn() && (rid in request.auth.token.rids)
             && (request.auth.token.rids[rid] in ['admin', 'kds']);
    }

    match /restaurants/{rid} {
      // Base settings and menu – public read
      allow read: if true;
      allow write: if isAdmin(rid);

      match /categories/{categoryId} {
        allow read: if true;
        allow write: if isAdmin(rid);
      }

      match /menuItems/{itemId} {
        allow read: if true;
        allow write: if isAdmin(rid);
      }

      match /settings/{docId} {
        allow read: if true;                  // guests can see payments.enabled
        allow write: if isAdmin(rid);
      }

      match /orders/{orderId} {
        // Creation only by signed-in guests (anonymous or account);
        // status starts as "received"; totals/paid validated by Functions.
        allow create: if isSignedIn()
                      && request.resource.data.status == 'received'
                      && request.resource.data.sessionId == request.auth.uid
                      && request.resource.data.table is string
                      && request.resource.data.items is list;

        // Guests can read only their own orders (sessionId == uid)
        allow get, list: if isAdmin(rid) || (isSignedIn() && resource.data.sessionId == request.auth.uid);

        // Guests cannot update orders
        allow update, delete: if isAdmin(rid);
      }
    }
  }
}
```

---

## 🗄️ Storage Rules (skeleton)

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null; }
    function isAdmin(rid) {
      return isSignedIn() && (rid in request.auth.token.rids)
             && (request.auth.token.rids[rid] in ['admin', 'kds']);
    }

    // Public read for menu images
    match /restaurants/{rid}/{allPaths=**} {
      allow read: if true;
      // Write only by admin/KDS
      allow write: if isAdmin(rid);
    }
  }
}
```

---

## ⚙️ Cloud Functions (core)

**1) `createOrder` (callable)**

* Validate table/items; read prices from DB.
* Transactionally increment `counters/{YYYY-MM-DD}.tableCounters[table]`.
* Build `orderNumber` (e.g., `T7-012`).
* Compute `totals` (subtotal/service/grand) on the backend.
* Write `status="received"`, `paid=false`, `createdAt/updatedAt=serverTimestamp()`.
* Return `{ orderId, orderNumber }`.
* Send FCM to topic `admin_{rid}`.

**2) `updateOrderStatus` (callable)**

* Validate transitions: `received→in_progress→ready→served` and `received→canceled`.
* Update `updatedAt`.
* Optional: FCM to KDS on `ready`.

**3) `ordersOnCreate` (onCreate trigger)**

* Backup FCM when a new order appears with `status="received"`.

**4) `createCheckout` (callable, when payments are enabled)**

* Read `restaurants/{rid}/settings/payments`. If `enabled=false` → throw `unavailable`.
* Validate order/amount/currency.
* Create a PaymentIntent (e.g., Stripe) with metadata `{ rid, orderId, sessionId }`.
* Return `{ clientSecret }`.

**5) `paymentWebhook` (HTTP)**

* Verify signature (e.g., `stripe.webhook_secret`).
* On `payment_intent.succeeded` → set `orders/{orderId}.paid = true`, `payment.status="paid"`.
* If `payments.enabled=false` → no-op.

> **Secrets:**
> Set via:
> `firebase functions:config:set stripe.secret=sk_test_... stripe.webhook_secret=whsec_...`
> (Don’t keep keys in git.)

---

## 💳 Payments Toggle (on/off per restaurant)

**Settings (Firestore):**

```
restaurants/{rid}/settings/payments {
  enabled: boolean,              // default false
  provider: "none" | "stripe",   // default "none"
  currency: "BGN",               // or "EUR"
  testMode: boolean              // default true
}
```

**UI behavior:**

* If `enabled=false` → hide “Pay now”, show “Pay at counter”.
* If `enabled=true && provider="stripe"` → show checkout (dynamic import of Stripe.js).
* Admin can flip the flag on `/admin/settings` — takes effect **without redeploy**.

**Provider abstraction (frontend):**

```
/apps/web/src/payments/PaymentProvider.ts     # interface
/apps/web/src/payments/NullPaymentProvider.ts # returns isAvailable=false
/apps/web/src/payments/StripePaymentProvider.ts
```

A factory reads `settings/payments` and returns the proper provider.

---

## 🔔 FCM (notifications)

* Topic: `admin_{rid}` for all KDS devices in a restaurant.
* Store tokens under: `restaurants/{rid}/adminDevices/{token}`.
* In the service worker: push handler for background; in `/admin` show in-app toasts when in foreground.

---

## 📱 PWA Settings

* `vite-plugin-pwa` with `manifest.webmanifest` (name, short_name, icons, `start_url=/menu`).
* Service Worker:

  * **Cache-first** for static assets and menu images.
  * **Network-first** for lists/item detail.
  * **Always-online** (no cache) for creating/updating orders.
* Offline screen and retry logic when connection is restored.

---

## 🧭 Navigation & Routes

**Guest PWA (`/apps/web`):**

* `/menu?rid={rid}&table={table}` — menu + cart/place order
* `/order-status` — live status for the current session
* `/checkout` — only when payments are enabled

**Admin/KDS (`/apps/admin`):**

* `/admin?rid={rid}` — real-time orders (columns by status)
* `/admin/settings` — settings including the Payments toggle

---

## 🧪 Emulators & Local Development

1. Install tools:

```bash
npm i -g firebase-tools
npm i
```

2. Enable Firebase **Anonymous Auth** (for guests) and Email/Password (for admin).

3. Create `.env` files:

**`apps/web/.env` and `apps/admin/.env`:**

```ini
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FCM_VAPID_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...   # only if payments are enabled
```

4. Run locally:

```bash
npm run dev:web
npm run dev:admin
firebase emulators:start
```

---

## 🚀 Deploy

* **Hosting:** two site configs (app and admin) or sub-paths.
* **Functions/Rules:**
  `firebase deploy --only functions,hosting,firestore:rules,storage:rules`
* Configure domain + HTTPS. Add HTTP headers for PWA (SW scope, caching).

---

## 🧾 QR Code Generation

* For each table generate a static QR to:
  `https://app.domain/menu?rid=R123&table=T7`
* Maintain a CSV: `table,qrUrl,printedAt`.
* Optional: “Generate QR for table” button in Admin.

---

## 🔒 Security & Privacy

* Minimize personal data (no name/phone by default).
* Rate limit and validation in Functions (anti-spam by `sessionId`/`table`).
* Admin access: Firebase Auth + custom claims per `rid`.
* Log admin actions (status changes, notes) in `auditLogs`.

---

## 🌍 I18n & Localization

* Language packs `bg`/`en`.
* Currency formats and VAT notes.

---

## 🧭 Roadmap

* [ ] Coupons/discounts
* [ ] Variants/modifiers (size, toppings)
* [ ] Analytics (by hour/category)
* [ ] Kitchen/bar printer integration
* [ ] Roles: manager, waiter, bar, kitchen
* [ ] Dark theme and deeper a11y tests

---

## 📁 License

MIT

---

## 🏷️ Name Ideas (brand options)

* **QRMenu** • **Scan&Serve** • **TableTap** • **DigiMenu** • **QuickBite**
* **ScanOrder** • **Tap’n’Order** • **MenuLink** • **MasaQR** • **Fork&QR**
* **OrderFlow** • **BiteWave**

> For a public GitHub profile, we recommend a descriptive repo name (**`qrmenu-pwa-firebase`**) and a branded name in the UI (**Scan&Serve**).

---

### Definition of Done (DoD)

* `pnpm i && pnpm dev` starts `/apps/web`; emulators via `firebase emulators:start`.
* An order can be created from `/menu` (seed menu in Firestore).
* KDS shows the order in real time and can change statuses.
* FCM notification is received in `/admin` for a new order.
* PWA installs (A2HS) and the menu works offline.
* **Payments toggle:** `/admin/settings` can turn payments on/off; when ON (Stripe) payment works and the webhook marks `paid=true`.


# BG - Scan&Serve — QR меню PWA (Firebase)

---

## ✨ Основни възможности

* **QR → Меню по маса:** статични QR кодове по маси, формат:
  `https://app.домейн/menu?rid=R123&table=T7`
* **PWA / Add to Home Screen:** офлайн кеш за меню, бърз старт, икони, splash.
* **Поръчка от клиента:** категории, търсене, количка, бележки към артикул, подаване на поръчка.
* **Реално време (Firestore):** новите поръчки се появяват незабавно в админ/KDS.
* **Статуси на поръчки:** `Received → In progress → Ready → Served` (+ `Canceled`).
* **Номерация на поръчки:** по маса и ден (напр. `T7-012`).
* **Известия за админ:** Firebase Cloud Messaging (браузър/телефон) при нова поръчка.
* **Админ/KDS екран:** филтри по маса/статус, звук/вибрация при нова поръчка, бързи действия, история.
* **Снимки и медии:** Firebase Storage; опц. автоматична оптимизация/преоразмеряване.
* **Плащания (по избор):** плъгабълна интеграция (напр. Stripe), **вкл./изкл. с настройка** per restaurant.
* **Многоезичност (i18n):** готовност за BG/EN.
* **Достъпност:** контраст, клавиатурна навигация, ARIA роли.

---

## 🧱 Технологичен стек

* **Фронтенд:** React + Vite, TypeScript, Tailwind CSS, React Router, vite-plugin-pwa (Service Worker + `manifest.webmanifest`).
* **Firebase:** Authentication *(анонимен вход за клиенти + имейл/парола за админ)*, **Firestore** (реално време), **Cloud Functions** (валидации, номерация, уебхукове), **Cloud Storage** (снимки), **Hosting**, **FCM** (известия).

---

## 🗺️ Архитектура (високо ниво)

```
Клиент (PWA) ───(QR URL)───> /menu?rid=...&table=...
       │            │
       │            ├─> Firestore (меню, поръчки - live)
       │            ├─> Storage (снимки)
       │            └─> Cloud Functions (валидации, номерация, плащания, FCM)
       │
       └─> FCM (push известия към Админ/KDS)

Админ/KDS (уеб/PWA) ──> Firestore (subscribe /orders) ──> UI статуси + звук/уведомления
```

---

## 🗂️ Структура на проекта

```
qrmenu-pwa-firebase/
├─ apps/
│  ├─ web/                 # клиентска PWA (React + Vite)
│  └─ admin/               # админ/KDS SPA (React + Vite)
├─ functions/              # Firebase Cloud Functions (TypeScript)
├─ tools/                  # помощни скриптове (напр. генератор на QR кодове)
├─ firestore.rules         # правила за сигурност
├─ storage.rules           # правила за Storage
├─ firebase.json           # конфигурация за Hosting/Emulators
├─ .firebaserc
└─ README.md
```

---

## 🗃️ Модел на данните (Firestore)

**URL схема:** `/menu?rid=R123&table=T7`

**Топ-левел:**

```
restaurants/{rid}
  name: string
  currency: "BGN" | "EUR" | ...
  logoUrl: string
  settings: {
    serviceFeePct: number | null
  }
```

**Меню:**

```
restaurants/{rid}/categories/{categoryId}
  name: string
  position: number

restaurants/{rid}/menuItems/{itemId}
  name: string
  description: string
  price: number          # в най-малка парична единица или число
  imagePath: string      # path в Storage (не пряк URL)
  imageUrl: string       # публичен URL (по избор)
  categoryId: string
  tags: string[]
  available: boolean
  updatedAt: timestamp
```

**Броячи и поръчки:**

```
restaurants/{rid}/counters/{YYYY-MM-DD}
  tableCounters: { [tableId: string]: number }  # дневен инкремент по маса

restaurants/{rid}/orders/{orderId}
  orderNumber: string           # напр. "T7-012"
  table: string                 # напр. "T7"
  sessionId: string             # == Firebase Auth UID на клиента (анонимен вход)
  status: "received" | "in_progress" | "ready" | "served" | "canceled"
  items: [
    { itemId, nameSnap, priceSnap, qty, notes }
  ]
  totals: {
    subtotal: number,
    service: number,
    grand: number
  }
  paid: boolean
  payment: {
    method: "cash" | "card" | "online" | null,
    provider: "stripe" | "none" | null,
    status: "pending" | "paid" | "failed" | null
  }
  createdAt: timestamp
  updatedAt: timestamp
```

**Настройки за плащания (toggle):**

```
restaurants/{rid}/settings/payments
  enabled: boolean               # default false
  provider: "none" | "stripe"    # default "none"
  currency: "BGN" | "EUR" | ...
  testMode: boolean              # default true
```

> **Бележки:**
>
> * Съхранявайте `nameSnap`/`priceSnap` в `items[]`, за да не се променя историята при редакция на менюто.
> * `sessionId` = **анонимен Firebase Auth UID** → улеснява правилата за „само моите поръчки“.

**Индекси (минимум):**

* Композитен: `(status, createdAt desc)`
* Композитен: `(table, createdAt desc)`

---

## 🔐 Firestore правила (скелет)

Изискваме **анонимен Auth** за клиентската PWA.
Админ/KDS има custom claim за конкретното `rid`.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin(rid) {
      // custom claims: { rids: { [rid]: "admin" | "kds" } }
      return isSignedIn() && (rid in request.auth.token.rids)
             && (request.auth.token.rids[rid] in ['admin', 'kds']);
    }

    match /restaurants/{rid} {
      // Базови настройки и меню – публично четене
      allow read: if true;
      allow write: if isAdmin(rid);

      match /categories/{categoryId} {
        allow read: if true;
        allow write: if isAdmin(rid);
      }

      match /menuItems/{itemId} {
        allow read: if true;
        allow write: if isAdmin(rid);
      }

      match /settings/{docId} {
        allow read: if true;                  // clients могат да видят payments.enabled
        allow write: if isAdmin(rid);
      }

      match /orders/{orderId} {
        // Създаване само от подписани (анонимно или с акаунт) клиенти;
        // статусът започва като "received"; totals/paid се валидират от Functions.
        allow create: if isSignedIn()
                      && request.resource.data.status == 'received'
                      && request.resource.data.sessionId == request.auth.uid
                      && request.resource.data.table is string
                      && request.resource.data.items is list;

        // Клиентът чете само своите поръчки (по sessionId == uid)
        allow get, list: if isAdmin(rid) || (isSignedIn() && resource.data.sessionId == request.auth.uid);

        // Клиентът няма право да обновява поръчки
        allow update, delete: if isAdmin(rid);
      }
    }
  }
}
```

---

## 🗄️ Storage правила (скелет)

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null; }
    function isAdmin(rid) {
      return isSignedIn() && (rid in request.auth.token.rids)
             && (request.auth.token.rids[rid] in ['admin', 'kds']);
    }

    // Публично четене на изображения за меню
    match /restaurants/{rid}/{allPaths=**} {
      allow read: if true;
      // Писане само от админ/KDS
      allow write: if isAdmin(rid);
    }
  }
}
```

---

## ⚙️ Cloud Functions (основни)

**1) `createOrder` (callable)**

* Валидира маса/артикули; чете цени от DB.
* Транзакционно увеличава `counters/{YYYY-MM-DD}.tableCounters[table]`.
* Формира `orderNumber` (напр. `T7-012`).
* Пресмята `totals` (subtotal/service/grand) на бекенда.
* Записва `status="received"`, `paid=false`, `createdAt/updatedAt=serverTimestamp()`.
* Връща `{ orderId, orderNumber }`.
* Изпраща FCM към тема `admin_{rid}`.

**2) `updateOrderStatus` (callable)**

* Валидира преходи: `received→in_progress→ready→served` и `received→canceled`.
* Обновява `updatedAt`.
* По желание: FCM към KDS при `ready`.

**3) `ordersOnCreate` (onCreate trigger)**

* Резервно FCM при нова поръчка със `status="received"`.

**4) `createCheckout` (callable, ако плащанията са включени)**

* Чете `restaurants/{rid}/settings/payments`. Ако `enabled=false` → грешка `unavailable`.
* Валидация на поръчката/сума/валута.
* Създава PaymentIntent (напр. Stripe) с метаданни `{ rid, orderId, sessionId }`.
* Връща `{ clientSecret }`.

**5) `paymentWebhook` (HTTP)**

* Верифицира подпис (напр. `stripe.webhook_secret`).
* При `payment_intent.succeeded` → задава `orders/{orderId}.paid = true`, `payment.status="paid"`.
* Ако `payments.enabled=false` → no-op.

> **Секрети:**
> Задайте с:
> `firebase functions:config:set stripe.secret=sk_test_... stripe.webhook_secret=whsec_...`
> (Не пазете ключове в git.)

---

## 💳 Payments toggle (вкл./изкл. per restaurant)

**Настройки (Firestore):**

```
restaurants/{rid}/settings/payments {
  enabled: boolean,              // default false
  provider: "none" | "stripe",   // default "none"
  currency: "BGN",               // или "EUR"
  testMode: boolean              // default true
}
```

**UI поведение:**

* Ако `enabled=false` → скрий „Pay now“, покажи „Плащане на място“.
* Ако `enabled=true && provider="stripe"` → покажи checkout (динамичен import на Stripe.js).
* Админ може да превключва флага от `/admin/settings` — влиза в сила **без redeploy**.

**Абстракция на провайдър (frontend):**

```
/apps/web/src/payments/PaymentProvider.ts     # интерфейс
/apps/web/src/payments/NullPaymentProvider.ts # връща isAvailable=false
/apps/web/src/payments/StripePaymentProvider.ts
```

Фабрика чете `settings/payments` и връща подходящия провайдър.

---

## 🔔 FCM (известия)

* Тема: `admin_{rid}` за всички KDS устройства на ресторанта.
* Съхранявайте токени под: `restaurants/{rid}/adminDevices/{token}`.
* В service worker: push handler за background; във `/admin` показвайте in-app toast при foreground.

---

## 📱 PWA настройки

* `vite-plugin-pwa` с `manifest.webmanifest` (име, кратко име, икони, start_url=`/menu`).
* Service Worker:

  * **Cache-first** за статика и изображения на меню.
  * **Network-first** за списъци/детайли на артикули.
  * **Always-online** (без кеш) за създаване/ъпдейт на поръчки.
* Offline екран и ретрай логика при възстановена връзка.

---

## 🧭 Навигация и маршрути

**Клиентска PWA (`/apps/web`):**

* `/menu?rid={rid}&table={table}` — страница меню + количка/поръчка
* `/order-status` — статус на текущата сесия (live)
* `/checkout` — само ако плащанията са включени

**Админ/KDS (`/apps/admin`):**

* `/admin?rid={rid}` — поръчки в реално време (колони по статус)
* `/admin/settings` — настройки включително Payments toggle

---

## 🧪 Емулdтори и локална разработка

1. Инсталирайте инструментите:

```bash
npm i -g firebase-tools
npm i
```

2. Активирайте Firebase **Anonymous Auth** (за клиенти) и Email/Password (за админ).

3. Създайте `.env` файлове:

**`apps/web/.env` и `apps/admin/.env`:**

```ini
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FCM_VAPID_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...   # само ако плащанията са включени
```

4. Стартирайте локално:

```bash
npm run dev:web
npm run dev:admin
firebase emulators:start
```

---

## 🚀 Деплой

* **Hosting:** две сайтови конфигурации (app и admin) или под-пътища.
* **Functions/Rules:**
  `firebase deploy --only functions,hosting,firestore:rules,storage:rules`
* Настройте домейн и HTTPS. Добавете HTTP headers за PWA (SW scope, caching).

---

## 🧾 Генериране на QR кодове

* За всяка маса генерирайте статичен QR към:
  `https://app.домейн/menu?rid=R123&table=T7`
* Поддържайте CSV: `table,qrUrl,printedAt`.
* По избор: бутон в админ „Генерирай QR за маса“.

---

## 🔒 Сигурност и поверителност

* Минимизирайте лични данни (без име/телефон по подразбиране).
* Rate limit и валидации във Functions (антиспам по `sessionId`/`table`).
* Админ достъп: Firebase Auth + custom claims по `rid`.
* Логвайте админ действия (сменен статус, бележки) в `auditLogs`.

---

## 🌍 I18n и локализация

* Езикови пакети `bg`/`en`.
* Валутни формати и ДДС бележки.

---

## 🧭 Пътна карта

* [ ] Купони/отстъпки.
* [ ] Варианти/модификатори (size, toppings).
* [ ] Аналитики (обобщения по час/категория).
* [ ] Интеграция с принтер (кухня/бар).
* [ ] Роли: мениджър, сервитьор, бар, кухня.
* [ ] Тъмна тема и по-детайлни A11y тестове.

---

## 📁 Лиценз

MIT

---

### Definition of Done (DoD)

* `pnpm i && pnpm dev` стартира `/apps/web`; емулатори тръгват с `firebase emulators:start`.
* Поръчка може да бъде създадена от `/menu` (seed меню в Firestore).
* KDS показва поръчката в реално време и сменя статуси.
* Получава се FCM известие в `/admin` при нова поръчка.
* PWA се инсталира (A2HS) и менюто работи офлайн.
* **Payments toggle:** `/admin/settings` може да вкл./изкл. плащания; при ON (Stripe) – плащане минава, webhook маркира `paid=true`.
