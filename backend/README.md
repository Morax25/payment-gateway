# Backend (Food Delivery System)

A backend for a food-delivery style app — restaurants list menus, customers place orders, restaurant owners manage order status, and delivery partners handle pickup/drop-off.

Built with Node.js, Express, Prisma, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js (ESM modules)
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens), cookie-based
- **Validation:** Zod (via a shared `validate` middleware)

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── src/
│   ├── configs/
│   │   └── database.js          # Prisma client singleton
│   ├── middlewares/
│   │   ├── auth.middleware.js   # authenticate / authorize
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── restaurant/
│   │   ├── menu/
│   │   ├── order/
│   │   └── delivery/
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── asyncHandler.js
│   └── app.js
├── index.js
└── .env
```

Each module under `modules/` follows the same shape: `*.routes.js`, `*.controller.js`, and `*.schema.js` where validation is needed.

## Data Model

Four roles: `CUSTOMER`, `RESTAURANT_OWNER`, `DELIVERY_PARTNER`, `ADMIN`.

- **User** — base account, tied to a role. Owners have restaurants, customers have orders, delivery partners   have deliveries.
- **Restaurant** — owned by a `User` (`RESTAURANT_OWNER`), has an open/closed flag and a menu.
- **MenuItem** — belongs to a restaurant, has price + availability toggle.
- **Order** — placed by a customer against a restaurant, moves through a status pipeline.
- **OrderItem** — line items on an order, price snapshotted at order time (never trusts client-sent prices).
- **Delivery** — links an order to a delivery partner, tracks pickup/delivery timestamps.

### Order status flow

```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
   ↓            ↓
CANCELLED   CANCELLED
```

Transitions are enforced server-side — you can't jump straight from `PENDING` to `DELIVERED`, and once an order is `DELIVERED` or `CANCELLED` it's locked.

### Delivery status flow

```
ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
                                        ↘ FAILED
```

Marking a delivery as `DELIVERED` also flips the linked `Order.status` to `DELIVERED` in the same transaction, so the two never drift out of sync.

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
   JWT_ACCESS_SECRET=
   JWT_REFRESH_SECRET=
   PORT=3001
   NODE_ENV=development
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

4. (Optional) Seed the database with test data:
   ```bash
   npm run seed
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

## API Overview

All routes are prefixed with `/api`. Most require `authenticate` (valid JWT) and some also require `authorize(<role>)`.

### Auth — `/api/auth`
| Method | Route | Who |
|---|---|---|
| POST | `/register` | anyone |
| POST | `/login` | anyone |
| POST | `/refresh` | anyone with a valid refresh token |
| POST | `/logout` | authenticated |
| GET | `/me` | authenticated |

### Restaurant — `/api/restaurant`
| Method | Route | Who |
|---|---|---|
| POST | `/` | RESTAURANT_OWNER |
| GET | `/` | public |
| GET | `/:id` | public |
| PATCH | `/:id` | owner (own restaurant only) |
| DELETE | `/:id` | owner (own restaurant only) |

### Menu — `/api/menu`
| Method | Route | Who |
|---|---|---|
| POST | `/add` | RESTAURANT_OWNER |
| GET | `/:restaurantId` | authenticated |
| PATCH | `/` | owner (own restaurant's items only) |
| DELETE | `/:id` | owner (own restaurant's items only) |
| PATCH | `/availability` | owner (own restaurant's items only) |

### Order — `/api/order`
| Method | Route | Who |
|---|---|---|
| POST | `/` | CUSTOMER |
| GET | `/me` | CUSTOMER (own orders) |
| PATCH | `/cancel` | CUSTOMER (own orders, only while cancellable) |
| GET | `/restaurant/:restaurantId` | RESTAURANT_OWNER (own restaurant only) |
| PATCH | `/status` | RESTAURANT_OWNER (own restaurant's orders only) |
| GET | `/:id` | customer, owner, or admin tied to that order |

### Delivery — `/api/delivery`
| Method | Route | Who |
|---|---|---|
| POST | `/assign` | RESTAURANT_OWNER / ADMIN |
| GET | `/me` | DELIVERY_PARTNER (own deliveries) |
| PATCH | `/pickup` | DELIVERY_PARTNER (own deliveries) |
| PATCH | `/deliver` | DELIVERY_PARTNER (own deliveries) |
| GET | `/:id` | partner, owner, customer, or admin tied to that delivery |

## Key design decisions

- **Prices are never trusted from the client.** `placeOrder` re-fetches `MenuItem.price` from the DB and computes the total server-side, using whatever prices are current at order time.
- **Ownership is always re-checked at the query level**, not just via role middleware. A `RESTAURANT_OWNER` JWT alone isn't enough to touch a resource — every mutating query also filters by the actual `ownerId`/`customerId`/`partnerId` on the record.
- **Status changes go through an allowed-transitions map**, so no one can skip steps in the order/delivery lifecycle by sending an arbitrary status value.
- **Order and Delivery status stay in sync via `$transaction`**, so a partial failure never leaves them pointing at inconsistent states.

## Not yet implemented

- Payment tracking (no `Payment` model yet — `totalAmount` exists on `Order` but nothing records how/if it was actually paid)
- Delivery partner auto-assignment (currently manual, `partnerId` passed explicitly)
- Delivery address (currently no dedicated field — worth adding to `Order` before going further)
- Rate limiting on auth routes
- Notifications (status changes don't push anything to the customer/owner/partner yet)
