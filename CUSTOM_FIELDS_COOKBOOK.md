# Ledger Atlas — Custom Fields Template Library

**Document version:** 1.0
**Status:** Living reference — new verticals added as we learn them
**Audience:** Admins configuring a new workspace, implementation partners, vertical specialists

> Pre-built custom field sets for common verticals. Each template tells you what fields to create, the right data type for each, suggested sections and ordering, and why this field matters in this industry. Copy the list, create the fields in your workspace, and your platform is tailored to your industry in under an hour.

---

## How to use this library

Each template is structured the same way:

- **Vertical** — the industry this template serves.
- **Entity** — which Ledger Atlas entity the fields attach to (Product, Customer, Asset).
- **Field list** — field key, label, data type, required flag, section, display order, and notes.
- **Companion recommendations** — settings to configure and rules to enable alongside these fields.
- **Why these fields** — a brief rationale for why this vertical needs these fields and not the generic defaults.

You can install a template by creating each field manually through the Admin → Custom Fields UI, or by scripting the creation via API. A planned feature will let you install a template in one click.

### Templates in this library

1. **Pharmacy** — regulated retail with batch tracking and compliance needs
2. **Hardware Store** — mid-market retail with supplier complexity
3. **Electronics Retail** — warranty, serial numbers, and after-sales service
4. **Agricultural Inputs** — seasonal, regulated, farmer-facing
5. **Restaurant / Café** — menu items, ingredients, recipe costing
6. **Fashion / Apparel** — variants, seasons, trend cycles
7. **Professional Services (field services)** — job-based, asset-heavy operations
8. **Wholesale Distribution** — high-volume B2B with credit and logistics
9. **Auto Parts** — compatibility, interchange, supersession
10. **Beauty / Cosmetics** — expiry, batch, compliance

---

## 1. Pharmacy

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `generic_name` | Generic name | string | No | Drug info | The non-brand chemical/generic name (e.g. "Paracetamol" for "Panadol") |
| 2 | `active_ingredient` | Active ingredient | string | Yes | Drug info | Pharmacologically active compound(s) |
| 3 | `strength` | Strength | string | Yes | Drug info | e.g. "500mg", "250mg/5ml" |
| 4 | `dosage_form` | Dosage form | enum | Yes | Drug info | tablet, capsule, syrup, injection, cream, drops, inhaler, suppository |
| 5 | `pack_size` | Pack size | string | Yes | Drug info | e.g. "30 tablets", "100ml", "box of 10" |
| 6 | `schedule` | Prescription schedule | enum | Yes | Regulatory | OTC, POM (prescription only), controlled |
| 7 | `requires_batch_tracking` | Requires batch tracking | boolean | Yes | Regulatory | Always true for pharmacy |
| 8 | `requires_refrigeration` | Cold chain required | boolean | No | Storage | Vaccines, insulin, certain biologics |
| 9 | `storage_temperature_min` | Min storage temp (°C) | number | No | Storage | Typical cold-chain is 2–8°C |
| 10 | `storage_temperature_max` | Max storage temp (°C) | number | No | Storage | |
| 11 | `manufacturer` | Manufacturer | string | No | Sourcing | Pharmaceutical manufacturer |
| 12 | `country_of_origin` | Country of origin | string | No | Sourcing | For import tracking |
| 13 | `pharmacy_board_reg_no` | PPB registration number | string | No | Regulatory | Pharmacy and Poisons Board (Kenya) registration |
| 14 | `narcotic_schedule` | Narcotic classification | enum | No | Regulatory | none, schedule_i, schedule_ii, schedule_iii, schedule_iv |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `nhif_number` | NHIF / SHA number | string | No | Insurance | For insurance claims |
| 2 | `insurance_provider` | Insurance provider | string | No | Insurance | AAR, Jubilee, CIC, NHIF, etc. |
| 3 | `insurance_policy_no` | Policy number | string | No | Insurance | |
| 4 | `chronic_patient` | Chronic condition patient | boolean | No | Medical | For regular dispensing reminders |
| 5 | `chronic_conditions` | Chronic conditions | json | No | Medical | Array of condition names, confidential |
| 6 | `allergies_warnings` | Known allergies / warnings | text | No | Medical | For drug interaction checks |
| 7 | `preferred_pharmacist` | Preferred pharmacist | reference → User | No | Preferences | |
| 8 | `prescription_delivery` | Delivery preferred | boolean | No | Preferences | Willing to pay for delivery |

### Companion recommendations

**Settings:**
- `pharmacy.expiry_warning_days` = `60`
- `pharmacy.cold_chain_temp_alert_enabled` = `true`
- `pharmacy.controlled_substance_approval_required` = `true`
- `pharmacy.ppb_license_number` = `"<your PPB license>"`

**Rules:**
- Warranty expiry warning variant for batch expiry (Rule Cookbook #25 adapted)
- Controlled substance sale policy (requires pharmacist role)
- Insurance claim generation on prescription sale
- Chronic patient refill reminder

### Why these fields

Kenyan pharmacies face four layers of complexity that generic retail doesn't: Pharmacy and Poisons Board registration, batch-level traceability for recalls, insurance reimbursement workflow, and cold chain management for vaccines and biologics. These fields make every sale compliant and every dispense traceable. The schedule field alone prevents accidental sale of prescription-only medicines without a script.

---

## 2. Hardware Store

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `brand` | Brand | string | No | Identification | Manufacturer brand |
| 2 | `model_number` | Model number | string | No | Identification | Manufacturer model |
| 3 | `barcode_ean` | Barcode (EAN/UPC) | string | No | Identification | Scannable barcode |
| 4 | `weight_kg` | Weight (kg) | decimal | No | Dimensions | For shipping cost |
| 5 | `length_cm` | Length (cm) | decimal | No | Dimensions | |
| 6 | `width_cm` | Width (cm) | decimal | No | Dimensions | |
| 7 | `height_cm` | Height (cm) | decimal | No | Dimensions | |
| 8 | `volume_cubic_m` | Volume (m³) | decimal | No | Dimensions | Computed; used for shipping |
| 9 | `material` | Primary material | enum | No | Specifications | wood, metal, plastic, composite, other |
| 10 | `color` | Color | string | No | Specifications | |
| 11 | `power_rating_watts` | Power rating (W) | number | No | Specifications | For electrical items |
| 12 | `voltage` | Voltage (V) | enum | No | Specifications | 12, 24, 110, 220, 240, dual, other |
| 13 | `warranty_months` | Warranty (months) | number | No | After-sales | |
| 14 | `default_supplier` | Default supplier | reference → Vendor | No | Sourcing | For auto-reorder PO |
| 15 | `alternative_suppliers` | Alternative suppliers | json | No | Sourcing | Array of vendor IDs |
| 16 | `country_of_origin` | Country of origin | string | No | Sourcing | |
| 17 | `import_duty_category` | Import duty category | string | No | Regulatory | For tariff calculation |
| 18 | `hs_code` | HS code | string | No | Regulatory | Harmonized System code for customs |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `business_type` | Business type | enum | No | Segmentation | contractor, developer, individual, reseller, ngo, government |
| 2 | `kra_pin` | KRA PIN | string | No | Regulatory | For eTIMS invoice |
| 3 | `business_reg_no` | Business reg number | string | No | Regulatory | |
| 4 | `project_codes` | Current project codes | json | No | Operations | For contractors running multiple projects |
| 5 | `credit_terms_days` | Credit terms (days) | number | No | Credit | Payment days allowed |
| 6 | `preferred_delivery_address` | Preferred delivery address | text | No | Logistics | |

### Companion recommendations

**Settings:**
- `hardware.barcode_scanning_enabled` = `true`
- `hardware.shipping.use_volumetric_weight` = `true`
- `hardware.contractor_discount_percent` = `10`

**Rules:**
- Auto-reorder to default supplier (Cookbook #5)
- Contractor segment auto-discount (Cookbook #16 adapted)
- Volumetric weight calculation for shipping

### Why these fields

Hardware stores deal with physical items where dimensions, weight, and compatibility matter. Shipping costs depend on volumetric weight; quoting depends on accurate dimensions. The contractor/developer business types drive pricing and credit terms in ways retail doesn't need. Model number and HS code support warranty claims and customs clearance.

---

## 3. Electronics Retail

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `brand` | Brand | string | Yes | Identification | Critical for electronics — drives price |
| 2 | `model_number` | Model | string | Yes | Identification | Official manufacturer model |
| 3 | `imei_required` | Requires IMEI tracking | boolean | Yes | Identification | True for phones, modems |
| 4 | `serial_required` | Requires serial tracking | boolean | Yes | Identification | True for laptops, appliances |
| 5 | `year_of_release` | Year of release | number | No | Identification | |
| 6 | `warranty_months` | Warranty period (months) | number | Yes | After-sales | Manufacturer warranty |
| 7 | `warranty_type` | Warranty type | enum | No | After-sales | manufacturer, retailer, extended, none |
| 8 | `warranty_call_center` | Warranty service number | string | No | After-sales | For customer reference |
| 9 | `return_window_days` | Return window (days) | number | No | After-sales | Store return policy window |
| 10 | `specifications` | Specifications | json | No | Technical | Structured: CPU, RAM, storage, display, etc. |
| 11 | `color_options` | Color options | enum | No | Variant | |
| 12 | `storage_capacity_gb` | Storage (GB) | number | No | Variant | For laptops, phones, storage devices |
| 13 | `ram_gb` | RAM (GB) | number | No | Variant | For computers |
| 14 | `screen_size_inches` | Screen size (inches) | decimal | No | Variant | For TVs, laptops, phones |
| 15 | `is_refurbished` | Is refurbished | boolean | No | Condition | |
| 16 | `energy_rating` | Energy rating | enum | No | Regulatory | A+++, A++, A+, A, B, C, D |
| 17 | `kebs_approval_no` | KEBS approval number | string | No | Regulatory | Kenya Bureau of Standards |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `warranty_contact_phone` | Warranty contact phone | string | No | After-sales | Alternate number for warranty issues |
| 2 | `preferred_service_center` | Preferred service center | reference → Location | No | After-sales | |
| 3 | `extended_warranty_purchases` | Extended warranties held | json | No | After-sales | Array of warranty records |

### Companion recommendations

**Settings:**
- `electronics.return_window_default_days` = `14`
- `electronics.warranty.claim_approval_role` = `"service_manager"`

**Rules:**
- Warranty expiry warning for customer purchases
- Return window enforcement (reactive rule blocks returns outside window)
- Refurbished product disclaimer on receipt

### Why these fields

Electronics buyers care about specifications and warranty more than almost any other retail category. IMEI tracking is mandatory for mobile phones in Kenya (anti-theft). Specifications as JSON lets you capture variable structures (a laptop has CPU/RAM/storage; a TV has panel type/resolution/HDR). Warranty handling is the defining post-sale experience — getting this data right saves the customer service team hours per week.

---

## 4. Agricultural Inputs (seeds, fertilizer, pesticides, vet supplies)

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `category_ag` | Ag category | enum | Yes | Classification | seed, fertilizer, pesticide, herbicide, fungicide, veterinary, feed, equipment |
| 2 | `crop_suitability` | Suitable crops | json | No | Classification | Array: maize, wheat, tea, coffee, horticulture, etc. |
| 3 | `season_suitability` | Suitable seasons | enum | No | Classification | long_rains, short_rains, dry, any |
| 4 | `brand_variety` | Brand / variety | string | No | Identification | For seeds: variety name (e.g. H614) |
| 5 | `active_ingredient` | Active ingredient | string | No | Composition | For chemicals |
| 6 | `concentration` | Concentration | string | No | Composition | e.g. "480 g/L" |
| 7 | `application_rate` | Application rate | string | No | Usage | e.g. "2 kg per acre" |
| 8 | `phi_days` | Pre-harvest interval (days) | number | No | Safety | Days between last application and harvest |
| 9 | `toxicity_class` | Toxicity class | enum | No | Safety | I, II, III, IV (WHO classification) |
| 10 | `ppe_required` | PPE required | text | No | Safety | Description of required PPE |
| 11 | `pcpb_registration_no` | PCPB registration number | string | No | Regulatory | Pest Control Products Board (Kenya) |
| 12 | `kebs_standard` | KEBS standard ref | string | No | Regulatory | |
| 13 | `batch_required` | Batch tracking required | boolean | Yes | Regulatory | Almost always true |
| 14 | `requires_cold_storage` | Cold storage required | boolean | No | Storage | For some vaccines |
| 15 | `shelf_life_months` | Shelf life (months) | number | No | Storage | |
| 16 | `pack_size` | Pack size | string | Yes | Packaging | "50kg bag", "1L bottle", "500g packet" |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `farm_size_acres` | Farm size (acres) | decimal | No | Farm | |
| 2 | `primary_crops` | Primary crops | json | No | Farm | Array of crop names |
| 3 | `livestock_types` | Livestock types | json | No | Farm | For vet supplies |
| 4 | `cooperative_id` | Cooperative membership | string | No | Affiliation | For discount and credit eligibility |
| 5 | `extension_officer` | Extension officer | string | No | Support | Assigned agricultural officer |
| 6 | `farm_location_ward` | Farm location (ward) | string | No | Logistics | For delivery routing |
| 7 | `farm_county` | County | enum | No | Logistics | Kenyan counties list |

### Companion recommendations

**Settings:**
- `agri.season.current` = `"long_rains"`
- `agri.phi_warning_enabled` = `true`

**Rules:**
- Seasonal product alert (flag products out of season)
- Batch expiry warning for chemicals
- Cooperative member discount (decision table)

### Why these fields

Agricultural inputs are heavily regulated (PCPB) and highly seasonal. Farmers need advice on application rates, suitable crops, and PHI. Customer demographics (farm size, county) drive pricing and delivery logistics. The cooperative affiliation is culturally important in Kenya — many farmers buy through co-ops that negotiate group discounts.

---

## 5. Restaurant / Café

### Products (menu items) — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `menu_section` | Menu section | enum | Yes | Menu | appetizer, main, dessert, drink, side, breakfast, combo |
| 2 | `dietary_flags` | Dietary flags | json | No | Menu | Array: vegetarian, vegan, halal, gluten_free, dairy_free, nut_free |
| 3 | `spice_level` | Spice level | enum | No | Menu | none, mild, medium, hot, extra_hot |
| 4 | `prep_time_minutes` | Prep time (minutes) | number | No | Operations | For kitchen display and wait-time estimate |
| 5 | `recipe` | Recipe (ingredients) | json | No | Recipe | Structured: array of {ingredient_id, quantity, unit} |
| 6 | `recipe_yield` | Recipe yield | number | No | Recipe | How many servings per recipe |
| 7 | `is_customizable` | Customizable | boolean | No | Menu | Allows modifiers like "no onions" |
| 8 | `modifiers_available` | Available modifiers | json | No | Menu | Array of modifier names |
| 9 | `is_kids_menu` | Kids menu | boolean | No | Menu | |
| 10 | `is_alcohol` | Contains alcohol | boolean | No | Regulatory | For liquor license compliance |
| 11 | `kitchen_station` | Kitchen station | enum | No | Operations | grill, fryer, cold_kitchen, bar, barista |
| 12 | `availability_schedule` | Availability schedule | json | No | Menu | Structured times when available |
| 13 | `image_url` | Menu image | string | No | Menu | |
| 14 | `calories` | Calories per serving | number | No | Nutrition | |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `favorite_orders` | Favorite orders | json | No | Preferences | Array of product IDs |
| 2 | `dietary_restrictions` | Dietary restrictions | json | No | Preferences | Array of restriction tags |
| 3 | `allergies` | Known allergies | text | No | Medical | |
| 4 | `loyalty_visits` | Loyalty visit count | number | No | Loyalty | For punch-card style loyalty |
| 5 | `typical_table_size` | Typical party size | number | No | Preferences | |

### Companion recommendations

**Settings:**
- `restaurant.happy_hour.enabled` = `true`
- `restaurant.happy_hour.start` = `"17:00"`
- `restaurant.happy_hour.end` = `"19:00"`
- `restaurant.happy_hour.discount_percent` = `15`
- `restaurant.tip_suggestion_percents` = `[10, 15, 20]`

**Rules:**
- Happy hour pricing (decision table gated by time)
- Kitchen display on sale creation
- Ingredient stock deduction per recipe (reactive)
- Menu availability enforcement (validation)

### Why these fields

Restaurants need recipes to convert menu sales into ingredient inventory consumption. Dietary flags matter for customer service and legal liability. Kitchen station drives order routing. Happy hour and time-of-day availability are core to restaurant operations.

---

## 6. Fashion / Apparel

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `brand` | Brand | string | Yes | Identification | |
| 2 | `collection` | Collection / season | string | No | Catalog | "SS26", "AW25", "Core" |
| 3 | `year` | Year | number | No | Catalog | |
| 4 | `season` | Season | enum | No | Catalog | spring, summer, autumn, winter, all_season |
| 5 | `gender` | Target gender | enum | No | Catalog | mens, womens, unisex, kids_boys, kids_girls, kids_unisex |
| 6 | `age_group` | Age group | enum | No | Catalog | infant, toddler, kids, teen, adult |
| 7 | `size` | Size | enum | No | Variant | XS, S, M, L, XL, XXL, 3XL |
| 8 | `color` | Color | string | No | Variant | |
| 9 | `fabric` | Primary fabric | enum | No | Material | cotton, polyester, blend, denim, silk, wool, leather, synthetic, other |
| 10 | `fabric_composition` | Fabric composition | string | No | Material | "80% cotton, 20% polyester" |
| 11 | `care_instructions` | Care instructions | text | No | Material | |
| 12 | `country_of_origin` | Country of origin | string | No | Sourcing | |
| 13 | `style_category` | Style category | enum | No | Catalog | casual, formal, sports, sleepwear, swimwear, outerwear, accessories |
| 14 | `is_end_of_season` | End of season / clearance | boolean | No | Lifecycle | |
| 15 | `reorderable` | Can be reordered | boolean | No | Lifecycle | False for one-off collections |
| 16 | `parent_style_id` | Parent style ID | string | No | Variant | Groups variants |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `preferred_sizes` | Preferred sizes | json | No | Preferences | e.g. {"top": "L", "bottom": "32", "shoe": "42"} |
| 2 | `style_preferences` | Style preferences | json | No | Preferences | Array of style categories |
| 3 | `color_preferences` | Color preferences | json | No | Preferences | |
| 4 | `stylist_assigned` | Stylist | reference → User | No | VIP | For high-end / personal shopping |
| 5 | `fitting_notes` | Fitting notes | text | No | VIP | Stylist's notes about fit |

### Companion recommendations

**Settings:**
- `fashion.end_of_season_discount_percent` = `30`
- `fashion.fitting_room_holds_hours` = `24`

**Rules:**
- End-of-season auto-markdown (scheduled rule)
- Style variant recommendation on sale completion
- Fitting room hold expiry

### Why these fields

Fashion retailers deal with size and color variants at scale, seasonal turnover, and a customer relationship that's often style-driven rather than transactional. The `parent_style_id` field is crucial for cross-variant reporting.

---

## 7. Professional Services / Field Services

### Products (services) — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `service_category` | Service category | enum | Yes | Classification | installation, maintenance, repair, inspection, consultation, emergency |
| 2 | `billing_basis` | Billing basis | enum | Yes | Pricing | per_hour, per_visit, per_project, fixed_price, per_unit |
| 3 | `default_duration_hours` | Default duration (hours) | decimal | No | Operations | For scheduling |
| 4 | `skills_required` | Required skills | json | No | Operations | Array of skill tags |
| 5 | `certification_required` | Certification required | string | No | Operations | e.g. "Licensed Electrician" |
| 6 | `parts_typically_used` | Parts typically needed | json | No | Operations | Array of {product_id, typical_qty} |
| 7 | `callout_fee` | Callout fee (KES) | decimal | No | Pricing | |
| 8 | `travel_fee_per_km` | Travel fee per km | decimal | No | Pricing | |
| 9 | `warranty_days` | Service warranty (days) | number | No | After-service | For the service work |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `primary_site_address` | Primary service address | text | Yes | Site | |
| 2 | `site_gps_coords` | GPS coords | string | No | Site | "lat,lng" for navigation |
| 3 | `site_access_instructions` | Access instructions | text | No | Site | Gate code, security contact |
| 4 | `preferred_technician` | Preferred technician | reference → User | No | Preferences | |
| 5 | `service_contract_id` | Active service contract | string | No | Contract | |
| 6 | `contract_expires` | Contract expiry | date | No | Contract | |
| 7 | `sla_response_hours` | SLA response (hours) | number | No | Contract | For contracted customers |

### Assets (client-owned equipment) — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `client_id` | Client | reference → Customer | Yes | Ownership | The asset belongs to this client |
| 2 | `installation_date` | Installation date | date | No | Lifecycle | |
| 3 | `last_service_date` | Last service date | date | No | Maintenance | |
| 4 | `next_service_due` | Next service due | date | No | Maintenance | |
| 5 | `service_contract_id` | Contract covering this asset | string | No | Contract | |
| 6 | `model` | Model | string | No | Identification | |
| 7 | `serial_number` | Serial number | string | Yes | Identification | |
| 8 | `manufacturer` | Manufacturer | string | No | Identification | |

### Companion recommendations

**Settings:**
- `services.dispatch_sms_enabled` = `true`
- `services.technician_rate_per_hour` = `3000`

**Rules:**
- Service contract expiry warning
- Next service due reminder
- Dispatch SMS on service booking

### Why these fields

Field service businesses rotate around the intersection of customer, asset, and technician. Tracking client-owned assets separately from your own lets you build maintenance history and optimize dispatch.

---

## 8. Wholesale Distribution (FMCG)

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `case_pack_size` | Case pack size | number | Yes | Packaging | Units per case |
| 2 | `cases_per_pallet` | Cases per pallet | number | No | Packaging | For warehouse stacking |
| 3 | `pack_weight_kg` | Case weight (kg) | decimal | No | Packaging | For logistics |
| 4 | `min_order_case_qty` | Min order (cases) | number | No | Sales | Wholesale minimum |
| 5 | `moq_break_1_qty` | MOQ break 1 (cases) | number | No | Pricing | Volume tier 1 starts at |
| 6 | `moq_break_1_price` | MOQ break 1 price | decimal | No | Pricing | Price at tier 1 |
| 7 | `moq_break_2_qty` | MOQ break 2 (cases) | number | No | Pricing | |
| 8 | `moq_break_2_price` | MOQ break 2 price | decimal | No | Pricing | |
| 9 | `moq_break_3_qty` | MOQ break 3 (cases) | number | No | Pricing | |
| 10 | `moq_break_3_price` | MOQ break 3 price | decimal | No | Pricing | |
| 11 | `is_fast_moving` | Fast-moving SKU | boolean | No | Classification | ABC classification |
| 12 | `abc_class` | ABC classification | enum | No | Classification | A, B, C (inventory value) |
| 13 | `primary_manufacturer` | Manufacturer | reference → Vendor | No | Sourcing | |
| 14 | `barcode_case` | Case barcode | string | No | Identification | |
| 15 | `barcode_unit` | Unit barcode | string | No | Identification | |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `account_type` | Account type | enum | Yes | Classification | retailer, sub_distributor, end_user, export |
| 2 | `credit_limit_kes` | Credit limit (KES) | decimal | Yes | Credit | |
| 3 | `credit_terms_days` | Credit terms (days) | number | Yes | Credit | 30, 60, 90 |
| 4 | `credit_used_kes` | Credit used (computed) | decimal | No | Credit | Auto-updated |
| 5 | `payment_rating` | Payment rating | enum | No | Credit | excellent, good, slow, poor |
| 6 | `route_code` | Delivery route | string | No | Logistics | For truck route planning |
| 7 | `delivery_days` | Delivery days | json | No | Logistics | Array: ["monday", "thursday"] |
| 8 | `sales_rep` | Assigned sales rep | reference → User | No | Relationship | |
| 9 | `customer_since` | Customer since | date | No | Relationship | |
| 10 | `annual_volume_forecast_kes` | Annual volume forecast | decimal | No | Commercial | |

### Companion recommendations

**Settings:**
- `wholesale.default_credit_terms_days` = `30`
- `wholesale.route_optimization_enabled` = `true`
- `wholesale.min_order_value_kes` = `5000`

**Rules:**
- Credit limit enforcement (Cookbook #21)
- MOQ break discount decision table
- Route-based delivery scheduling
- Payment aging report weekly

### Why these fields

Wholesale distribution is fundamentally B2B: credit terms, volume pricing, route logistics, and sales rep coverage define the business. Case packs vs units matter because orders come in cases but inventory is sometimes tracked in units.

---

## 9. Auto Parts

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `part_number` | Part number | string | Yes | Identification | Manufacturer part number |
| 2 | `oem_part_number` | OEM part number | string | No | Identification | Original equipment manufacturer number |
| 3 | `alternative_part_numbers` | Alt part numbers | json | No | Identification | Array of interchangeable numbers |
| 4 | `supersedes` | Supersedes part numbers | json | No | Identification | This part replaces these old ones |
| 5 | `superseded_by` | Superseded by | string | No | Identification | This part has been replaced by |
| 6 | `manufacturer` | Manufacturer | string | Yes | Identification | Bosch, Denso, NGK, etc. |
| 7 | `brand_tier` | Brand tier | enum | No | Pricing | oem, premium_aftermarket, economy_aftermarket, remanufactured |
| 8 | `compatibility` | Vehicle compatibility | json | No | Compatibility | Structured: [{make, model, year_from, year_to, engine}] |
| 9 | `category_auto` | Category | enum | Yes | Classification | engine, transmission, electrical, suspension, brakes, body, interior, consumables, oils |
| 10 | `is_consumable` | Consumable | boolean | No | Classification | For oils, filters, bulbs |
| 11 | `fitment_side` | Fitment side | enum | No | Fitment | left, right, front, rear, front_left, front_right, rear_left, rear_right, any |
| 12 | `is_genuine` | Genuine OEM | boolean | No | Classification | |
| 13 | `warranty_months` | Warranty | number | No | After-sales | |
| 14 | `core_charge` | Core charge (KES) | decimal | No | Pricing | For remanufactured parts exchange |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `customer_type` | Customer type | enum | Yes | Classification | workshop, individual, fleet, reseller |
| 2 | `workshop_license` | Workshop license | string | No | Classification | |
| 3 | `fleet_vehicles` | Fleet vehicles | json | No | Fleet | Array of {make, model, year, registration} |
| 4 | `primary_vehicle_makes` | Primary vehicle makes serviced | json | No | Classification | For targeted recommendations |

### Companion recommendations

**Settings:**
- `auto_parts.compatibility_check_enabled` = `true`
- `auto_parts.show_alternatives_at_pos` = `true`

**Rules:**
- Compatibility check at POS (warns if part doesn't fit customer's vehicle)
- Suggest alternatives when stock-out
- Workshop loyalty discount

### Why these fields

Auto parts is defined by fitment and interchange. Alternative and superseded fields drive the "we don't stock that part but we stock this equivalent" conversation. Core charges on reman parts are a specific commercial pattern.

---

## 10. Beauty / Cosmetics

### Products — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `brand` | Brand | string | Yes | Identification | |
| 2 | `product_line` | Product line | string | No | Identification | e.g. "Dior Capture Youth" |
| 3 | `category_beauty` | Category | enum | Yes | Classification | skincare, makeup, haircare, bodycare, fragrance, tools |
| 4 | `sub_category` | Sub-category | string | No | Classification | e.g. "moisturizer", "lipstick", "shampoo" |
| 5 | `skin_type` | Skin type | json | No | Targeting | Array: oily, dry, combination, sensitive, normal, mature |
| 6 | `hair_type` | Hair type | json | No | Targeting | Array: oily, dry, colored, natural, fine, thick, curly |
| 7 | `color_shade` | Color / shade | string | No | Variant | For makeup, nail polish, hair color |
| 8 | `shade_code` | Shade code | string | No | Variant | Brand's shade identifier |
| 9 | `volume_ml` | Volume (ml) | decimal | No | Packaging | |
| 10 | `weight_grams` | Weight (grams) | decimal | No | Packaging | |
| 11 | `batch_required` | Batch tracking | boolean | Yes | Regulatory | Cosmetics require batch |
| 12 | `pao_months` | PAO (Period After Opening) | number | No | Regulatory | Months usable after opening |
| 13 | `shelf_life_months` | Shelf life (months) | number | No | Regulatory | Before opening |
| 14 | `ingredients` | Ingredients | text | No | Composition | Full INCI list |
| 15 | `is_vegan` | Vegan | boolean | No | Ethics | |
| 16 | `is_cruelty_free` | Cruelty-free | boolean | No | Ethics | |
| 17 | `is_halal` | Halal-certified | boolean | No | Ethics | |
| 18 | `is_pregnancy_safe` | Pregnancy-safe | boolean | No | Safety | |
| 19 | `kebs_approval_no` | KEBS approval number | string | No | Regulatory | |

### Customers — field list

| # | Field Key | Label | Type | Required | Section | Notes |
|---|---|---|---|---|---|---|
| 1 | `skin_type` | Skin type | enum | No | Profile | |
| 2 | `hair_type` | Hair type | enum | No | Profile | |
| 3 | `skin_concerns` | Skin concerns | json | No | Profile | Array: acne, aging, dullness, redness, etc. |
| 4 | `sensitivities` | Known sensitivities | text | No | Medical | Fragrance, certain actives |
| 5 | `preferred_brands` | Preferred brands | json | No | Preferences | |
| 6 | `beauty_advisor` | Assigned beauty advisor | reference → User | No | Relationship | |
| 7 | `loyalty_tier` | Loyalty tier | enum | No | Loyalty | standard, silver, gold, platinum |

### Companion recommendations

**Settings:**
- `beauty.expiry_warning_months` = `3`
- `beauty.pao_warning_enabled` = `true`

**Rules:**
- Batch expiry warning
- Recommendation by skin/hair type (decision)
- Loyalty tier points accrual

### Why these fields

Beauty retail sits at the intersection of regulated products and personal recommendation. PAO is a cosmetics-specific concept. Skin type and concerns drive recommendations; ethics flags drive purchase decisions for a significant customer segment.

---

## How to create fields in practice

For each field in a template, in the Admin → Custom Fields UI:

1. Select the correct entity type (Product, Customer, Asset) from the dropdown.
2. Click **Add Field**.
3. Enter the **Field Key** exactly as listed (snake_case, no spaces, no version numbers).
4. Enter the **Label** as shown.
5. Select the **Data Type** from the template.
6. Toggle **Required** per the template.
7. Set the **Section** (creates visual grouping on the form).
8. Set the **Display Order** (use the `#` column from the table above — or multiply by 10 to leave room for insertions).
9. For enum types, add the options when prompted.
10. For reference types, select the target entity.
11. Click **Save**.

### Batch installation (API)

If you're an implementation partner rolling out the platform to multiple tenants, script the field creation:

```bash
for field in fields.json; do
  curl -X POST https://api.ledgeratlas.com/api/v1/field-definitions \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field"
done
```

A JSON export of any of these templates is available on request, or from the Ledger Atlas Template Registry when it ships.

---

## Adapting templates

These templates are starting points, not prescriptions. You will:

- Remove fields you don't need.
- Add fields specific to your business.
- Rename labels.
- Change required flags.

The one rule: don't change field keys after data has been entered. Keys are forever.

---

## What's next

Future additions to this library:

- **Healthcare facilities** — clinic, dental, diagnostic lab-specific fields.
- **Education** — books, uniforms, school supplies.
- **Events & Hospitality** — weddings, conferences, equipment rental.
- **Logistics & Freight** — packages, shipments, routing.
- **Real Estate** — property, tenant, lease-specific fields.
- **Nonprofit / NGO** — donor, grant, program-specific tracking.
- **Gym / Fitness** — membership, class, equipment.

Each requires careful vertical research before being added; we don't publish templates we haven't seen deployed successfully.

---

*End of Custom Fields Template Library.*
