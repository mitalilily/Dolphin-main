# QA Automation Strategy - Multi-Carrier Shipping Aggregator

## 1. Scope
- End-to-end business flow: onboarding to tracking.
- Courier integration reliability for Shiprocket, Shipmozo, iCarry, Xpressbees.
- Financial correctness: rate, invoice, GST checks.
- Operational resilience: retries, timeout handling, webhook failures.

## 2. Test Pyramid
- Unit tests:
  - Retry and timeout utilities.
  - Courier service request/validation behavior (mocked network).
- Integration tests:
  - API endpoints with auth, payload validation, and error handling.
  - Negative and edge-case API scenarios.
- E2E tests (live environment):
  - Full workflow through real backend APIs.
  - Requires valid credentials and known-good payloads.
- Load tests:
  - 100 concurrent order creation requests.

## 3. Core Flow Coverage
1. Client onboarding + token issuance.
2. Admin approval.
3. Warehouse create + duplicate/invalid checks.
4. Order creation + invalid request checks.
5. Multi-courier rate calculation.
6. Courier selection validation.
7. Manifest generation + retry on failure.
8. External shipment verification.
9. AWB/label generation checks.
10. Invoice generation and tax/data validations.
11. Tracking updates + webhook failure fallback.

## 4. Failure Scenarios
- Upstream courier APIs return 4xx/5xx.
- Upstream courier APIs timeout.
- Empty rate arrays.
- Invalid shipment state transitions.
- Missing AWB/manifest artifacts.
- Invalid GST/tax components.

## 5. Reporting
- Console step-level logging for each scenario.
- Jest summary + custom QA summary reporter.
- Coverage output in `tests/reports/coverage`.

## 6. CI Recommendation
- Run `test:qa:unit` and `test:qa:integration` on every PR.
- Run `test:qa:e2e` nightly or on release branches with secured env.
- Run `test:qa:load` on pre-prod before cutover.
