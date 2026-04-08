# Own AI — Business Setup & Monetization

> Complete guide covering company registration, payment infrastructure, pricing, and profit projections.
> Last updated: March 2026

---

## 1. Business Registration — Kosovo

### Why Kosovo
- Denis is a Kosovo citizen — simplest and cheapest registration path
- 0% corporate tax under €30,000/year revenue (then 10% flat)
- Stripe unavailability is solved by Paddle (explicitly supports Kosovo)
- Full ownership rights as a citizen

### Company Type
**Sh.p.k. (Shoqëria me Përgjegjësi të Kufizuara)** — equivalent to LLC.
- 1 shareholder minimum
- €1 minimum share capital
- Full foreign/domestic ownership allowed
- Limited liability — personal assets protected

---

### Step-by-Step Registration

**Step 1 — Prepare Documents**
- Kosovo passport or ID
- Proof of address (utility bill or bank statement)
- Company name (check availability at ARBK website first)
- Registered address in Kosovo (can be family home address)

**Step 2 — Register at ARBK**
- Go to: **arbk.rks-gov.net** (Kosovo Business Registration Agency)
- Submit registration form + documents
- Fee: ~€50–100
- Processing time: ~5 business days
- You receive a Business Registration Certificate (Certifikata e Regjistrimit)

**Step 3 — Get Tax Number (NUI)**
- Register with Kosovo Tax Administration (ATK): **atk-ks.org**
- Get your Unique Identification Number (Numri Unik Identifikues)
- Required before opening a bank account

**Step 4 — Open Business Bank Account**
- Open at ProCredit Bank Kosovo OR Raiffeisen Bank Kosovo (see Section 3)
- Required documents: registration certificate, NUI, passport, proof of address

**Step 5 — Register for VAT (if needed)**
- Kosovo VAT rate: 18%
- Mandatory registration once annual turnover exceeds €50,000
- Optional voluntary registration below that threshold
- For EU customers: Paddle (as Merchant of Record) handles EU VAT — you don't register for EU VAT

**Total setup cost: ~€150–300 one-time**
**Timeline: 2–3 weeks from start to operational**

---

### Important Note on German Student Visa
Denis lives in Germany on a student visa. Key points:
- Being a **shareholder** in a Kosovo company = generally permitted (passive ownership)
- Being a **managing director** actively running the business = gray area
- **Action required:** Visit university Internationales Büro and ask:
  *"Can I hold a directorship in a foreign company and receive dividends on a §16b student visa?"*
- Do NOT pay yourself a salary from the company while on student visa
- Dividends (passive income) are generally fine
- Get written confirmation before registering

---

## 2. Payment Infrastructure

### The Stack

```
Customer pays
      ↓
   Paddle (Merchant of Record)
   — collects payment
   — handles EU VAT automatically
   — manages subscriptions
   — sends invoices to customers
      ↓
   Paddle pays out (SEPA — free, because Paysera has Lithuanian IBAN)
      ↓
   Paysera Business Account (Lithuanian IBAN — LT...)
   — holds EUR balance
   — EU-licensed, Kosovo companies accepted
   — free business account for Kosovo companies
      ↓
   Transfer to Kosovo bank (ProCredit or Raiffeisen) as needed
   OR spend directly from Paysera card/account
```

---

### Paddle Setup

**What Paddle does for you:**
- Processes all payments (cards, PayPal, Apple Pay, Google Pay, 30+ local methods)
- Collects and remits EU VAT in all 27 EU countries automatically
- Manages subscriptions (create, cancel, pause, upgrade)
- Handles chargebacks and fraud
- Provides customer billing portal (customers manage their own subscriptions)
- Generates and sends invoices to customers
- Kosovo is explicitly supported as a seller country

**Fees:** 5% + $0.50 per transaction (all-inclusive — no hidden fees)

**Payout:** Monthly, via SEPA to your Paysera Lithuanian IBAN (free transfer)

**Setup steps:**
1. Sign up at **paddle.com** (create Billing account — not Classic)
2. Complete business verification (KYC/KYB):
   - Kosovo business registration certificate
   - NUI (tax number)
   - Personal ID (passport)
   - Business website (your app)
   - Description of what you sell
3. While waiting for approval, build everything in **sandbox** (sandbox.paddle.com — separate account)
4. Create products and prices in the dashboard
5. Integrate SDK into your app (see Section 5)
6. Go live once approved (can take a few days to 2 weeks)

**Important:** Start Paddle account approval as early as possible — it is the only blocker to going live.

---

### Paysera Business Account

**Why Paysera:**
- EU-licensed in Lithuania → issues Lithuanian IBAN (LT...)
- Kosovo-registered companies explicitly supported
- **Free business account** for Kosovo companies (€0/month)
- SEPA transfers to/from EU: max €1 fee
- Paddle can pay out via SEPA directly to Lithuanian IBAN → no wire fees
- Transfers within Paysera: free

**Setup steps:**
1. Go to **paysera.com** → Business account
2. Register with:
   - Kosovo business registration certificate
   - NUI (tax number)
   - Personal ID
   - Description of business
3. Receive Lithuanian IBAN (LT...)
4. Set this IBAN as your payout account in Paddle dashboard
5. Paddle pays out monthly via SEPA to this account at no cost

**Paysera account also useful for:**
- Receiving direct B2B payments (invoice-based, no Paddle involved)
- Paying for business expenses in EUR
- Holding EUR balance outside Kosovo

---

### Kosovo Business Bank Account

Open at **ProCredit Bank Kosovo** or **Raiffeisen Bank Kosovo**.

| | ProCredit | Raiffeisen |
|---|---|---|
| SWIFT | MBKOXKPRXXX | RBKOXKPRXXX |
| International transfers | Via ProCredit Germany (cheap) | Via SWIFT + Wise partnership |
| Online banking | Yes | Yes |
| Business account online opening | Yes | Yes |
| EUR account | Yes | Yes |

Use this for:
- Local Kosovo expenses
- Withdrawing from Paysera when needed
- Salary payments to local employees (future)

**Not needed immediately** — Paysera alone is sufficient to start. Add Kosovo bank when you need local operations.

---

## 3. Pricing Model

### Structure

```
Free tier:     €2.00 in API credits on signup
               No card required
               When credits run out → prompt to subscribe

Subscription:  €2.00/month (billed as part of combined monthly charge)
               Includes €2.00 of API credits each month

API usage:     Tracked throughout the month
               Marked up 20% above actual API cost
               Billed combined with subscription at month end

Billing cycle: One single charge per month per user
               = €2 subscription + API usage from previous month
               First paid month: free (€2 credit, not unlimited)
```

### Why One Combined Charge
Paddle charges €0.50 fixed fee per transaction. Two separate charges (subscription + usage) = €1.00 in fixed fees alone. One combined charge = €0.50. Always combine into one monthly transaction.

### Why €2 Not €1 Subscription
```
€1 charge → Paddle takes €0.55 → you keep €0.45 (45%)
€2 charge → Paddle takes €0.60 → you keep €1.40 (70%)
```
€2 base makes the math work. €1 is unviable with Paddle's fee structure.

### Why Cap the Free Month
Unlimited free = abuse risk. A student using €20 of API in "free month" = €20 loss for you.
Cap at €2 of credits → controlled acquisition cost of €2 per new user maximum.

### API Markup
You pay OpenAI/Anthropic/Google their API rate. You charge users that rate + 20%.

Example markups:
| Model | Your cost per 1K tokens | You charge |
|---|---|---|
| GPT-5 Mini | $0.00025 input | $0.0003 |
| Claude Haiku | $0.0008 input | $0.00096 |
| Gemini Flash | $0.00015 input | $0.00018 |
| GPT-5.4 | $0.0025 input | $0.003 |

---

## 4. Profit Projections

### Per-User Economics

**Light user** (€2 API spend/month):
```
Subscription:        €2.00
API charged (×1.20): €2.40
Total charge:        €4.40
Paddle fee (5%+€0.50): -€0.72
API cost to you:     -€2.00
Profit:              €1.68/user/month
```

**Average user** (€5 API spend/month):
```
Subscription:        €2.00
API charged (×1.20): €6.00
Total charge:        €8.00
Paddle fee (5%+€0.50): -€0.90
API cost to you:     -€5.00
Profit:              €2.10/user/month
```

**Heavy user** (€15 API spend/month):
```
Subscription:        €2.00
API charged (×1.20): €18.00
Total charge:        €20.00
Paddle fee (5%+€0.50): -€1.50
API cost to you:     -€15.00
Profit:              €3.50/user/month
```

### Scale Projections (Average User = €2.10 profit/month)

| Paying Users | Monthly Profit | Annual Profit |
|---|---|---|
| 50 | €105 | €1,260 |
| 100 | €210 | €2,520 |
| 250 | €525 | €6,300 |
| 500 | €1,050 | €12,600 |
| 1,000 | €2,100 | €25,200 |
| 2,000 | €4,200 | €50,400 |
| 5,000 | €10,500 | €126,000 |

**Kosovo tax note:**
- Under €30,000/year revenue: 0% corporate tax
- Over €30,000/year revenue: 10% flat corporate tax on profit
- You hit this at roughly 1,500 average paying users

### Break-Even on Business Setup Costs
Setup costs ~€300 (registration + banking). Break-even at ~150 user-months. With 50 users, break-even in 3 months.

---

## 5. Technical Integration (Paddle into Own AI)

### Backend Installation
```bash
cd backend
npm install @paddle/paddle-node-sdk
```

### Backend Environment Variables to Add
```
PADDLE_API_KEY=           # from Paddle dashboard (server-only, never expose)
PADDLE_WEBHOOK_SECRET=    # from Paddle dashboard > Notifications
PADDLE_ENVIRONMENT=sandbox # change to 'production' when live
```

### Frontend Environment Variables to Add
```
VITE_PADDLE_CLIENT_TOKEN=  # public client-side token (safe to expose)
VITE_PADDLE_ENV=sandbox    # change to 'production' when live
```

### New Backend Routes Needed
```
POST   /api/billing/checkout      Create Paddle checkout session
GET    /api/billing/subscription  Get user's current subscription
GET    /api/billing/usage         Get current month usage + projected charge
POST   /webhooks/paddle           Paddle webhook receiver (NOT under /api)
```

### New Database Columns Needed
```sql
-- On users table:
ALTER TABLE users ADD COLUMN paddle_customer_id TEXT;
ALTER TABLE users ADD COLUMN paddle_subscription_id TEXT;
ALTER TABLE users ADD COLUMN balance NUMERIC(12,4) DEFAULT 0;
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
-- subscription_status: 'free' | 'trialing' | 'active' | 'paused' | 'canceled'
```

### Monthly Usage Billing Flow
```
1. Cron job runs on 1st of each month (or day before renewal)
2. Query chat_messages for previous month's costs per user
3. Apply 20% markup
4. For each active subscriber with usage > €0.50:
   Call Paddle API: subscriptions.createOneTimeCharge(subscriptionId, {
     effectiveFrom: 'next_billing_period',
     items: [{ price: { unitPrice: calculatedAmount }, quantity: 1 }]
   })
5. Paddle bills it on renewal date, sends invoice to customer
6. Webhook 'transaction.completed' fires → record in admin_transactions
```

### Key Webhooks to Handle
| Event | Action |
|---|---|
| `subscription.activated` | Set user subscription_status = 'active', grant access |
| `subscription.canceled` | Set subscription_status = 'canceled', revoke at period end |
| `subscription.paused` | Set subscription_status = 'paused' |
| `transaction.completed` | Record charge in admin_transactions |
| `transaction.past_due` | Send low-balance warning, restrict new messages |

### Webhook Setup in Express (Critical)
```typescript
// MUST be before app.use(express.json())
app.use('/webhooks/paddle', express.raw({ type: 'application/json' }))

app.post('/webhooks/paddle', async (req, res) => {
  res.status(200).send('ok') // respond immediately
  const event = paddle.webhooks.unmarshal(
    req.body.toString(),
    process.env.PADDLE_WEBHOOK_SECRET,
    req.headers['paddle-signature'] as string
  )
  // process event asynchronously
})
```

---

## 6. VAT Handling

**Short answer: Paddle handles everything. You do nothing.**

Since Paddle is your Merchant of Record:
- Paddle is the legal seller to your customers
- Paddle collects VAT at each EU customer's local rate (19% Germany, 20% France, etc.)
- Paddle remits VAT to each EU tax authority
- You receive net revenue (after Paddle's fee and VAT)
- Your invoices to customers are issued by Paddle, not by you

**Kosovo domestic VAT:**
- 18% Kosovo VAT rate
- Registration mandatory above €50,000/year turnover
- Below that, voluntary — not needed at early stage
- Paddle does NOT handle Kosovo domestic VAT (only EU) — consult a Kosovo accountant when approaching €50,000

---

## 7. Accounting & Compliance

### What Records to Keep
- Paddle dashboard: all transactions, invoices, payouts — downloadable
- Paysera: all bank statements — downloadable
- Your own DB: admin_transactions table (all charges linked to users)
- Monthly: reconcile Paddle payouts with Paysera received amounts

### Kosovo Annual Filing
- Annual financial report to ARBK
- Annual tax return to ATK
- Hire a local Kosovo accountant for this (~€50–150/month or one-off at year end)
- Cost is very low in Kosovo — most small businesses pay €600–1,200/year for accounting

### Germany Tax Note (Important)
As a German tax resident (183+ days in Germany), Germany may attribute Kosovo company profits to you under CFC rules (Hinzurechnungsbesteuerung §7-14 AStG). This is complex.

**Action required:** Consult a German Steuerberater (tax advisor) before the company starts earning revenue. A 1-hour consultation costs ~€150–300 and gives you clarity on your German tax obligations. Do not skip this.

---

## 8. Timeline to Launch

```
Week 1-2:   Register Kosovo company (submit ARBK application)
Week 1:     Open Paysera Business account (online, fast)
Week 1:     Create Paddle sandbox account, start integration
Week 2-3:   Build billing features in sandbox (backend + frontend)
Week 2:     Open Kosovo bank account (ProCredit or Raiffeisen)
Week 3:     Submit Paddle production account for approval (start early)
Week 3-4:   Test full payment flow in sandbox
Week 4-5:   Paddle approval received
Week 5:     Switch to production keys, go live with billing
```

---

## 9. Summary Checklist

### Company
- [ ] Check company name availability at arbk.rks-gov.net
- [ ] Register Sh.p.k. at ARBK (~€50–100, ~5 days)
- [ ] Get NUI from ATK
- [ ] Consult university Internationales Büro about student visa + directorship
- [ ] Consult German Steuerberater about CFC tax rules

### Banking
- [ ] Open Paysera Business account (paysera.com, free for Kosovo)
- [ ] Note Lithuanian IBAN (LT...) from Paysera
- [ ] Open Kosovo bank account at ProCredit or Raiffeisen (optional at start)

### Payments
- [ ] Create Paddle sandbox account (sandbox.paddle.com)
- [ ] Build full billing integration in sandbox
- [ ] Submit Paddle production account for approval (needs: registration cert, NUI, website)
- [ ] Set Paysera Lithuanian IBAN as payout account in Paddle
- [ ] Go live when approved

### Product
- [ ] Add pricing page to web app
- [ ] Add billing dashboard for users (current balance, usage, invoices)
- [ ] Add subscription management (links to Paddle customer portal)
- [ ] Implement monthly usage billing cron job
- [ ] Implement balance/usage tracking in admin panel
- [ ] Add free €2 credit on signup flow

### Legal
- [ ] Privacy policy page (required for Paddle + App Stores)
- [ ] Terms of service page (required for Paddle + App Stores)
- [ ] Cookie policy (required for EU users)

---

## 10. Optional — Register Company Under Father's Name

> This is a fully legal alternative structure that removes all student visa complications.

### How It Works
```
Dad owns company (100% shareholder + director, lives in Kosovo)
      ↓
Company earns revenue, pays 0–10% Kosovo corporate tax
      ↓
Dad receives dividends/salary
      ↓
Dad gifts money to Denis (his son)
      ↓
Denis receives it tax-free in Germany
(German law: up to €400,000 tax-free per parent per 10 years)
```

### Why This Is Cleaner
| Issue | Denis as owner | Dad as owner |
|---|---|---|
| Student visa conflict | Gray area | Zero risk |
| German CFC tax rules | Complicated | Not Denis's problem |
| German tax on received money | Potentially taxable | Gift = tax-free up to €400k |
| Overall legal risk | Moderate | None |

### The Contractor Angle (Bonus)
The company can pay Denis as a **freelance contractor** for development work.
- Denis invoices the company for software development
- Counts toward allowed work hours on student visa (120 full days/year)
- Denis gets paid legitimately, dad owns the company, Kosovo taxes apply

### What to Sort Out
- Write a simple **family founders agreement** — what happens if the company is sold, grows significantly, or Denis wants formal ownership later
- Dad handles Kosovo annual tax filing (simple, cheap — ~€600–1,200/year accountant)
- Denis stays off company documents entirely, or appears only as a contractor

### When to Use This Option
Consider this if:
- The Internationales Büro confirms directorship is not allowed on your visa
- You want zero legal uncertainty while studying
- Your dad is willing and available to handle the Kosovo-side administration

### When to Switch Back to Denis's Name
Once Denis has a post-study work visa (Blue Card, job seeker visa, etc.) or moves back to Kosovo, ownership can be transferred to Denis via a simple share transfer at ARBK.
