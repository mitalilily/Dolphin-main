# Courier API Audit Report (iCarry, Shipmozo, Shiprocket)

## 1. Discovery Summary
- Courier service files:
  - `src/models/services/couriers/icarry.service.ts`
  - `src/models/services/couriers/shipmozo.service.ts`
  - `src/models/services/couriers/shiprocket.service.ts`
- Sync controller:
  - `src/controllers/admin/courier.controller.ts` (`syncServiceProviderCouriersController`)
- Provider sync route:
  - `src/routes/courier.routes.ts` (`POST /couriers/providers/sync`)

## 2. Endpoint Mapping

### Shiprocket
| Endpoint | Method | File | Purpose |
|---|---|---|---|
| `/auth/login` | POST | `shiprocket.service.ts` | Auth token |
| `/courier/serviceability` | GET | `shiprocket.service.ts` | Rate/serviceability |
| `/orders/create/adhoc` | POST | `shiprocket.service.ts` | Create shipment/order |
| `/courier/track/awb/:awb` | GET | `shiprocket.service.ts` | Track shipment |
| `/orders/cancel` | POST | `shiprocket.service.ts` | Cancel order |
| `/courier/generate/pickup` | POST | `shiprocket.service.ts` | Pickup scheduling |

### Shipmozo
| Endpoint | Method | File | Purpose |
|---|---|---|---|
| `/rate-calculator` | POST | `shipmozo.service.ts` | Rate calculation |
| `/push-order` | POST | `shipmozo.service.ts` | Create shipment/order |
| `/track-order` | GET | `shipmozo.service.ts` | Track shipment |
| `/cancel-order` | POST | `shipmozo.service.ts` | Cancel order |
| `/schedule-pickup` | POST | `shipmozo.service.ts` | Pickup scheduling |

### iCarry
| Endpoint | Method | File | Purpose |
|---|---|---|---|
| `/api_login` | POST | `icarry.service.ts` | Auth token |
| `/api_get_estimate` | POST | `icarry.service.ts` | Rate estimate |
| `/api_track_shipment` | POST | `icarry.service.ts` | Track shipment |
| `/api_cancel_shipment` | POST | `icarry.service.ts` | Cancel shipment |
| `/api_add_shipment_international` | POST | `icarry.service.ts` | Create international shipment |

Notes:
- iCarry domestic create-shipment and pickup scheduling are not clearly documented in this codebase and are marked `NEEDS MANUAL REVIEW`.

## 3. Issues Found
1. Provider sync endpoint failed hard when one upstream provider failed (no partial success).
2. Sync output had limited diagnostics, making provider-specific failures hard to troubleshoot.
3. No shared retry/backoff utility used across all courier HTTP calls.
4. Missing timeout/failure unit test coverage for some couriers (Shipmozo/iCarry).
5. No unified provider interface for core actions across these three couriers.

## 4. Fixes Implemented
1. Added provider-resilient sync behavior:
   - File: `src/controllers/admin/courier.controller.ts`
   - `syncServiceProviderCouriersController` now:
     - continues syncing other providers even if one fails
     - returns `providerErrors[]` with provider-level error messages
     - returns `502` only if all provider syncs fail
2. Added retry/backoff utility:
   - File: `src/utils/httpRetry.ts`
   - Applied to:
     - `shiprocket.service.ts` request execution
     - `shipmozo.service.ts` request execution
     - `icarry.service.ts` request execution
3. Added unified courier interface:
   - File: `src/models/services/couriers/unifiedCourierClient.ts`
   - Methods:
     - `createShipment(orderData)`
     - `trackShipment(trackingId)`
     - `cancelShipment(shipmentId)`
     - `getRates(input)`
     - `schedulePickup(input)`
   - Undocumented/ambiguous flows explicitly throw `NEEDS MANUAL REVIEW`.
4. Extended unit tests:
   - `tests/unit/shipmozo.service.spec.ts`:
     - upstream failure case
     - timeout case
   - `tests/unit/icarry.service.spec.ts`:
     - timeout case

## 5. Before/After Highlights

### Before
- Sync controller wrapped all providers in one `try` block; one failure returned 500 and stopped all syncs.

### After
- Sync controller captures errors per provider and still syncs remaining providers.
- Response includes:
  - `syncedShiprocketCouriers`
  - `syncedShipmozoCouriers`
  - `syncedIcarryCouriers`
  - `providerErrors`

## 6. Risk Areas / Needs Manual Review
1. iCarry domestic create shipment and pickup scheduling endpoints are not explicit in current code/docs.
2. Shipmozo cancel-order requires both `order_id` and `awb_number`; unified single-ID abstraction is ambiguous.
3. Upstream provider docs/version drift should be verified before further payload changes.

## 7. Security Review
- Credentials continue to be sourced from DB/env-backed configuration.
- No hardcoded courier secrets were introduced.
- Request logging already masks sensitive keys/tokens in the three courier services.

## 8. Recommended Next Validation (Manual)
1. Trigger `POST /couriers/providers/sync` from admin and verify `providerErrors` for failing providers.
2. Verify credentials in `courier_credentials` for:
   - `shiprocket` (username/password)
   - `shipmozo` (public/private key)
   - `icarry` (username/api_key)
3. Run live smoke scripts in `apps/backend/src/scripts/` for each provider.

