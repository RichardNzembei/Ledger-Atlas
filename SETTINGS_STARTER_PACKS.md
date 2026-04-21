# Ledger Atlas — Settings Starter Packs

**Document version:** 1.0
**Status:** Living reference — new packs added as verticals mature
**Audience:** Admins setting up a new workspace, implementation partners onboarding customers

> Complete, ready-to-import settings bundles for common verticals. Each starter pack sets sensible defaults for currency, tax, receipts, notifications, POS behaviour, inventory thresholds, and vertical-specific features.

## Packs

| # | Pack | Category | Settings |
|---|---|---|---|
| 0 | Global Baseline | baseline | 45 |
| 1 | Retail — Small / Single-location | size | 18 |
| 2 | Retail — Multi-location Chain | size | 16 |
| 3 | Pharmacy (Kenya) | vertical | 25 |
| 4 | Hardware Store | vertical | 21 |
| 5 | Restaurant / Café | vertical | 28 |
| 6 | Agricultural Inputs | vertical | 22 |
| 7 | Electronics Retail | vertical | 20 |
| 8 | Wholesale Distribution | vertical | 24 |
| 9 | Auto Parts | vertical | 20 |
| 10 | Beauty / Cosmetics | vertical | 21 |

## Install order

1. Global Baseline (always first)
2. Size pack — small/single-location OR multi-location
3. Vertical pack
4. Tenant-specific overrides (business name, KRA PIN, addresses)

Later packs override earlier packs when keys conflict — this is deliberate.
