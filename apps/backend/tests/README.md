# Shipping Aggregator QA Automation Suite

This suite provides a production-grade automated framework for:
- Unit testing courier service logic and retry utilities
- Integration testing API scenarios (auth, warehouse, orders, manifest, invoice, tracking)
- Live E2E workflow testing
- Load simulation for 100 concurrent orders

## Folder Structure

```text
tests/
  TEST_STRATEGY.md
  .env.sample
  jest.config.ts
  tsconfig.test.json
  reporters/
    qaSummaryReporter.js
  setup/
    jest.setup.ts
  config/
    env.ts
    httpClient.ts
  helpers/
    auth.ts
    live.ts
    payloads.ts
    scenarioContext.ts
  utils/
    assertions.ts
    file.ts
    logger.ts
    retry.ts
  mocks/
    courierApis.mock.ts
  data/
    clients.json
    warehouses.json
    payloads/
      warehouse.valid.json
      order.b2c.valid.json
      manifest.valid.json
      invalid-cases.json
  unit/
    retry.util.spec.ts
    shiprocket.service.spec.ts
    shipmozo.service.spec.ts
    icarry.service.spec.ts
  integration/
    auth-client.integration.spec.ts
    warehouse.integration.spec.ts
    order-creation.integration.spec.ts
    rate-calculation.integration.spec.ts
    courier-selection.integration.spec.ts
    manifestation.integration.spec.ts
    external-verification.integration.spec.ts
    label-awb.integration.spec.ts
    invoice.integration.spec.ts
    tracking.integration.spec.ts
  e2e/
    full-workflow.e2e.spec.ts
  load/
    hundred-concurrent-orders.spec.ts
```

## Prerequisites

1. Install dependencies:
```bash
cd apps/backend
npm install
```

2. Create env file:
```bash
cp tests/.env.sample tests/.env
```

3. Update `tests/.env` with valid environment credentials.

## Run Tests

- Full QA suite:
```bash
npm run test:qa
```

- Unit only:
```bash
npm run test:qa:unit
```

- Integration only:
```bash
npm run test:qa:integration
```

- E2E only (requires `QA_RUN_LIVE_E2E=true`):
```bash
npm run test:qa:e2e
```

- Load only (requires `QA_RUN_LIVE_E2E=true` and `QA_RUN_LOAD=true`):
```bash
npm run test:qa:load
```

## Scenario Mapping (A-J)

- A Auth & Client: `integration/auth-client.integration.spec.ts`
- B Warehouse: `integration/warehouse.integration.spec.ts`
- C Order Creation: `integration/order-creation.integration.spec.ts`
- D Rate Calculation: `integration/rate-calculation.integration.spec.ts`
- E Courier Selection: `integration/courier-selection.integration.spec.ts`
- F Manifestation: `integration/manifestation.integration.spec.ts`
- G External Verification: `integration/external-verification.integration.spec.ts`
- H Label + AWB: `integration/label-awb.integration.spec.ts`
- I Invoice: `integration/invoice.integration.spec.ts`
- J Tracking: `integration/tracking.integration.spec.ts`

## Notes

- Live tests are guarded by env toggles to avoid accidental calls in CI.
- Mocked courier tests simulate success/failure/slow behavior using `nock`.
- Custom QA reporter prints suite-level pass/fail summary.
