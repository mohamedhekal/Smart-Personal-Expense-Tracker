# Msarefy API - Complete Endpoints Documentation

Base URL: `http://localhost:8000/api`

Default headers
- `Accept: application/json`
- `Content-Type: application/json`
- Protected routes: `Authorization: Bearer <token>`

Auth (Sanctum Tokens)
- POST `/auth/register`
  - Body: `{ name, email, password, password_confirmation }`
  - 200: `{ success, data: { user, token } }`
- POST `/auth/login`
  - Body: `{ email, password }`
  - 200: `{ success, data: { user, token } }`
- POST `/auth/logout` (protected)
  - 200: `{ success, message }`
- GET `/user` (protected)
  - 200: `{ success, data: user }`

Example responses
```json
// POST /auth/login 200
{
  "success": true,
  "data": {
    "user": { "id": 4, "name": "Mohamed Hekal", "email": "mohamed.k.hekal@gmail.com" },
    "token": "<sanctum_token>"
  }
}

// GET /user 200
{
  "success": true,
  "data": { "id": 4, "name": "Mohamed Hekal", "email": "mohamed.k.hekal@gmail.com" }
}

// POST /auth/logout 200
{ "success": true, "message": "Logged out" }
```

Example
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

Expenses (protected)
- GET `/expenses`
- GET `/expenses/{id}`
- POST `/expenses`
  - `{ name, amount, category_id?, date, is_monthly?, auto_add?, day_of_month?, notes? }`
- PUT `/expenses/{id}`
- DELETE `/expenses/{id}`

Example responses
```json
// GET /expenses 200
{
  "success": true,
  "data": [
    { "id": 1, "user_id": 4, "name": "Groceries", "amount": 1200.5, "category_id": 1, "date": "2025-10-30", "is_monthly": false, "auto_add": false, "day_of_month": null, "notes": "Weekly grocery run" },
    { "id": 2, "user_id": 4, "name": "Metro Card", "amount": 300, "category_id": 2, "date": "2025-10-28", "is_monthly": true, "auto_add": true, "day_of_month": 1, "notes": "Monthly recharge" }
  ]
}

// POST /expenses 201
{ "success": true, "data": { "id": 3, "name": "Coffee", "amount": 45, "date": "2025-10-30" } }

// GET /expenses/{id} 200
{ "success": true, "data": { "id": 1, "name": "Groceries", "amount": 1200.5 } }

// DELETE /expenses/{id} 200
{ "success": true, "message": "Deleted" }
```

Salaries (protected)
- GET `/salaries`
- GET `/salaries/{id}`
- POST `/salaries`
  - `{ company, amount, received_date?, notes?, is_recurring?, day_of_month?, is_certificate_return?, certificate_id? }`
- PUT `/salaries/{id}`
- DELETE `/salaries/{id}`

Example responses
```json
// GET /salaries 200
{ "success": true, "data": [ { "id": 1, "company": "Acme Inc.", "amount": 15000, "received_date": "2025-10-25", "is_recurring": true } ] }

// POST /salaries 201
{ "success": true, "data": { "id": 2, "company": "Side Gig", "amount": 3000 } }
```

Expense Categories (protected)
- Aliases mapped to same controller:
  - GET `/categories` and `/expense-categories`
  - POST `/categories` and `/expense-categories`
  - DELETE `/categories/{id}` and `/expense-categories/{id}`
  - Body: `{ name, icon?, color?, is_default? }`

Example responses
```json
// GET /categories 200
{ "success": true, "data": [
  { "id": 1, "name": "Food", "icon": "🍔", "color": "#FF8A65", "is_default": true },
  { "id": 2, "name": "Transport", "icon": "🚌", "color": "#4DB6AC", "is_default": true }
] }

// POST /categories 201
{ "success": true, "data": { "id": 5, "name": "Health", "icon": "💊" } }
```

Financial Goals (protected)
- GET `/goals`
- GET `/goals/{id}`
- POST `/goals`
  - `{ title, target_amount, current_amount?, deadline?, reminder_enabled? }`
- PUT `/goals/{id}`
- DELETE `/goals/{id}`
- POST `/goals/{id}/add-amount`
  - `{ amount }` → يزيد current_amount

Example responses
```json
// GET /goals 200
{ "success": true, "data": [ { "id": 1, "title": "Emergency Fund", "target_amount": 50000, "current_amount": 12000 } ] }

// POST /goals 201
{ "success": true, "data": { "id": 2, "title": "New Laptop", "target_amount": 35000, "current_amount": 0 } }

// POST /goals/{id}/add-amount 200
{ "success": true, "data": { "id": 1, "current_amount": 14000 } }
```

Bank Certificates (protected)
- GET `/certificates`
- GET `/certificates/{id}`
- POST `/certificates`
  - `{ bank_name, certificate_name, certificate_number?, amount, monthly_return?, return_day_of_month?, last_return_date?, max_withdrawal_limit?, deposit_date?, maturity_date? }`
- PUT `/certificates/{id}`
- DELETE `/certificates/{id}`

Example responses
```json
// GET /certificates 200
{ "success": true, "data": [ { "id": 1, "bank_name": "National Bank", "certificate_name": "3-Year Certificate", "amount": 200000, "monthly_return": 2500 } ] }

// POST /certificates 201
{ "success": true, "data": { "id": 2, "bank_name": "QNB", "certificate_name": "1-Year", "amount": 100000 } }
```

Certificate Withdrawals (protected)
- GET `/certificates/{id}/withdrawals`
- GET `/certificate-withdrawals/{id}`
- POST `/certificates/{id}/withdrawals`
  - `{ amount, date, repayment_date?, is_installment?, installment_count? }`
- POST `/withdrawals/{id}/repay` (alias أيضًا: `/certificate-withdrawals/{id}/repay`)
- POST `/withdrawals/{id}/pay-installment`
- DELETE `/certificate-withdrawals/{id}`

Example responses
```json
// GET /certificates/{id}/withdrawals 200
{ "success": true, "data": [ { "id": 1, "amount": 10000, "date": "2025-08-30", "is_installment": true, "paid_installments": 2, "installment_count": 5 } ] }

// POST /withdrawals/{id}/repay 200
{ "success": true, "data": { "id": 1, "is_repaid": true } }
```

Gold (protected)
- Purchases
  - GET `/gold/purchases`
  - GET `/gold/purchases/{id}`
  - POST `/gold/purchases`
    - `{ invoice_value, grams, price_per_gram, purity?, type?, purchase_date, notes? }`
  - PUT `/gold/purchases/{id}`
  - DELETE `/gold/purchases/{id}`
- Sales
  - GET `/gold/sales`
  - GET `/gold/sales/{id}`
  - POST `/gold/sales`
    - `{ purchase_id?, sale_value, price_per_gram?, sale_date, profit_loss?, notes? }`
  - DELETE `/gold/sales/{id}`

Example responses
```json
// GET /gold/purchases 200
{ "success": true, "data": [ { "id": 1, "invoice_value": 25000, "grams": 50.75, "price_per_gram": 492.5, "purchase_date": "2025-07-30" } ] }

// GET /gold/sales 200
{ "success": true, "data": [ { "id": 1, "sale_value": 12000, "price_per_gram": 510.75, "sale_date": "2025-09-30", "profit_loss": 350 } ] }
```

Activity Log (protected)
- GET `/activity` (alias: `/activity-log`)
  - Filters: `action`, `entity_type` (أو `entityType`), `from` (أو `startDate`), `to` (أو `endDate`) بصيغة YYYY-MM-DD
- POST `/activity-log`
  - `{ action, entity_type?, entity_id?, details?(object), amount? }`
- DELETE `/activity-log/{id}`
- DELETE `/activity-log` (مع فلاتر اختيارية لمسح مجموعة)

Example responses
```json
// GET /activity 200
{ "success": true, "data": [
  { "id": 1, "action": "expense_created", "entity_type": "expense", "amount": 1200.5, "created_at": "2025-10-30T10:00:00Z" }
] }
```

Reminders (protected)
- GET `/reminders`
- GET `/reminders/{id}`
- POST `/reminders`
  - `{ title, notes?, due_date?, is_done? }`
- DELETE `/reminders/{id}`

Example responses
```json
// GET /reminders 200
{ "success": true, "data": [ { "id": 1, "title": "Pay Internet Bill", "due_date": "2025-11-06", "is_done": false } ] }
```

Freelance (protected)
- Revenues
  - GET `/freelance/revenues`
  - GET `/freelance/revenues/{id}`
  - POST `/freelance/revenues`
    - `{ title, client?, amount, date, notes? }`
  - DELETE `/freelance/revenues/{id}`
- Payments
  - GET `/freelance/payments?revenueId={id}`
  - GET `/freelance/payments/{id}`
  - POST `/freelance/payments`
    - `{ revenue_id, amount, date, notes? }`
  - DELETE `/freelance/payments/{id}`

Example responses
```json
// GET /freelance/revenues 200
{ "success": true, "data": [ { "id": 1, "title": "Landing Page Project", "client": "Client A", "amount": 8000, "date": "2025-10-20" } ] }

// GET /freelance/payments?revenueId=1 200
{ "success": true, "data": [ { "id": 1, "revenue_id": 1, "amount": 4000, "date": "2025-10-23" } ] }
```

WhatsApp Subscriptions (protected)
- GET `/whatsapp/subscriptions`
- GET `/whatsapp/subscriptions/{id}`
- POST `/whatsapp/subscriptions`
  - `{ phone, plan?, amount?, start_date?, end_date?, is_active?, notes? }`
- DELETE `/whatsapp/subscriptions/{id}`

Example responses
```json
// GET /whatsapp/subscriptions 200
{ "success": true, "data": [ { "id": 1, "phone": "+201001112222", "plan": "Business Basic", "is_active": true } ] }
```

Notifications (protected)
- GET `/notifications`
- GET `/notifications/{id}`
- POST `/notifications`
  - `{ title, body?, data?(object) }`
- DELETE `/notifications/{id}`

Example responses
```json
// GET /notifications 200
{ "success": true, "data": [ { "id": 1, "title": "Welcome to Msarefy", "body": "Your account is ready.", "read_at": null } ] }
```

Settings (protected)
- GET `/settings`
- GET `/settings/{key}`
- POST `/settings`
  - `{ settings: { key: value, ... } }` (upsert لكل المفاتيح)
- DELETE `/settings/{key}`

Example responses
```json
// GET /settings 200
{ "success": true, "data": { "currency": "EGP", "language": "ar", "notifications_enabled": "true" } }

// POST /settings 200
{ "success": true, "data": { "currency": "USD" } }
```

Backups (protected) — stubs
- GET `/backups/latest`
- GET `/backups/{id}`
- POST `/backups/export`
- POST `/backups/import`
- DELETE `/backups/{id}`

Reports (protected)
- GET `/reports/overview?range=thisMonth|lastMonth|thisYear`
  - Returns totals for salaries/expenses حسب المدى
- GET `/reports/expenses-by-category?range=...`
- GET `/reports/monthly-comparison?year=YYYY`

Optimization (protected)
- GET `/optimization/recommendations`
  - يعيد savings_rate وتوصيات مبسطة للشهر الحالي

Emails (protected)
- POST `/emails/send`
  - `{ to, subject, body }`

Example responses
```json
// POST /emails/send 200
{ "success": true, "message": "Email queued" }
```

Validation & Errors
- 422: `{ message, errors: { field: [..] } }`
- 401: Unauthorized
- 403: Forbidden (ملكية المستخدم)
- 404: Not Found

CORS (dev)
- Allowed origins: أي `http://localhost:<port>` (بدون credentials عند استخدام Bearer)

Environment quick refs
- Frontend base: `VITE_API_BASE_URL=http://localhost:8000/api`
- Laravel `.env`: عيّن `FRONTEND_URL`, بيانات DB, إعدادات البريد

Postman/Insomnia/OpenAPI
- اطلب وسأوفر ملف Collection أو OpenAPI جاهز.
