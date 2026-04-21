# Ledger Atlas — Complete User Guide

> **Platform:** Inventory, POS & Asset Management  
> **Currency:** Kenyan Shilling (KES)  
> **Tax Rate:** 16% VAT (applied at POS)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Admin Dashboard Overview](#2-admin-dashboard-overview)
3. [Products](#3-products)
4. [Inventory & Stock Management](#4-inventory--stock-management)
5. [Point of Sale (POS)](#5-point-of-sale-pos)
6. [Customers](#6-customers)
7. [Locations](#7-locations)
8. [Assets](#8-assets)
9. [Custom Fields](#9-custom-fields)
10. [Business Rules](#10-business-rules)
11. [Settings](#11-settings)
12. [User Roles & Permissions](#12-user-roles--permissions)
13. [Business Process Workflows](#13-business-process-workflows)

---

## 1. Getting Started

### 1.1 Logging In

1. Open your browser and navigate to the application URL (e.g. `http://localhost:3100`).
2. You will be presented with the **Login** screen.
3. Enter the following credentials:
   - **Workspace** — your company's workspace slug (e.g. `riverbank`)
   - **Email** — your registered email address
   - **Password** — your account password
4. Click **Sign in**.
5. On success you are redirected to the **Products** page inside the Admin dashboard.

### 1.2 Registering a New Workspace

If your organisation does not yet have a workspace:

1. On the login screen click **Register** (or navigate to `/register`).
2. Fill in:
   - **Company Name** — the full legal or trading name.
   - **Workspace Slug** — a short lowercase identifier, e.g. `riverbank` (used in the URL).
   - **Admin Name** — your full name.
   - **Admin Email** — your email address.
   - **Password** — choose a strong password.
3. Click **Create Workspace**.
4. You are logged in automatically as the workspace **Admin**.

### 1.3 Navigating the Dashboard

After login you see a two-panel layout:

| Area | Description |
|---|---|
| **Left sidebar** | Navigation links to all sections |
| **Top bar** | Quick link to the POS terminal, dark/light mode toggle |
| **Main area** | Content for the currently selected section |

The sidebar contains:
- Products
- Inventory
- Customers
- Locations
- Assets
- Rules
- Custom Fields
- Settings

At the bottom of the sidebar your **display name**, **email**, and a **sign-out** button are always visible.

### 1.4 Signing Out

Click the **arrow-right** icon at the bottom of the sidebar. You will be returned to the login screen and your session cleared.

---

## 2. Admin Dashboard Overview

The dashboard opens on the **Products** page by default. All data shown is specific to your workspace (tenant); you cannot see data from other organisations.

Key concepts:
- **Tenant** — your workspace. All records belong to exactly one tenant.
- **Location** — a physical or virtual place where stock is held (store, warehouse, bin).
- **Product** — a sellable item tracked in inventory.
- **Sale** — a completed POS transaction.
- **Asset** — a fixed business asset (laptop, vehicle, machinery).

---

## 3. Products

**Path:** `/admin/products`  
**Who can use this:** Admin, Manager, Stock Manager

### 3.1 Viewing Products

The Products page displays all your catalogue items in a paginated table (50 per page).

**Table columns:**

| Column | Description |
|---|---|
| SKU | Unique stock-keeping unit code |
| Name | Product display name |
| Category | Optional grouping label |
| Price | Selling price in KES |
| Status | Active (green) or Inactive (grey) |

**Searching:** Type in the **Search by name or SKU** box. Results update automatically after a short pause (300 ms debounce).

**Filtering by category:** Use the **All categories** dropdown on the right of the search bar. The list is auto-populated from categories already in use.

**Pagination:** Use **← Prev** and **Next →** buttons at the bottom right. The total product count is shown bottom left.

### 3.2 Creating a Product

1. Click the orange **Add Product** button (top right).
2. The **New Product** modal opens. Fill in the fields:

| Field | Required | Notes |
|---|---|---|
| SKU | ✅ | Must be unique across your catalogue |
| Unit of Measure | | e.g. unit, kg, litre, box (default: unit) |
| Name | ✅ | Full product name |
| Category | | Free-text grouping (e.g. Groceries, Electronics) |
| Selling Price | ✅ | Base selling price in KES |
| Cost Price | ✅ | Your purchase/landed cost in KES |
| Reorder Point | | Quantity below which a reorder alert is triggered |
| Reorder Qty | | Suggested quantity to reorder |

3. Click **Create Product**. The table refreshes and your new product appears.

### 3.3 Editing a Product

1. Find the product in the table.
2. Click the **pencil (✏)** icon on the right of that row.
3. The **Edit Product** modal opens, pre-filled with current values.
4. Update any field.
5. Click **Save Changes**.

> **Tip:** Changing the **Selling Price** here updates all future POS sales. Existing completed sales are not affected.

### 3.4 Deactivating a Product

Deactivating a product removes it from the POS product grid and prevents new sales. It does **not** delete historical records.

- Currently done via the API (`DELETE /api/v1/products/:id`); a UI toggle is planned.

---

## 4. Inventory & Stock Management

**Path:** `/admin/inventory`  
**Who can use this:** Admin, Manager, Stock Manager

This section tracks on-hand quantities of each product at each location.

### 4.1 Viewing Stock Levels

The main table shows:

| Column | Description |
|---|---|
| Product | Product name |
| Location | Location name |
| Quantity | Total physical units on hand |
| Reserved | Units reserved for pending orders |
| Available | Quantity − Reserved (what you can sell) |
| Updated | Date of the last stock movement |

> **Warning indicator:** Quantity is shown in **red** when it is 10 or below.

**Filter by location:** Use the **All locations** dropdown to view stock at a specific site only.

### 4.2 Receiving Stock (Goods In)

Use **Receive Stock** when products arrive from a supplier or are brought in from an external source.

1. Click **Receive Stock** (top right).
2. In the modal, fill in:

| Field | Required | Notes |
|---|---|---|
| Product | ✅ | Select from dropdown |
| Location | ✅ | The destination location |
| Quantity | ✅ | Number of units received (minimum 1) |
| Notes | | PO number, supplier reference, etc. |

3. Click **Receive Stock** (submit button).
4. The table refreshes immediately showing the updated quantity.

> **Note:** Each Receive Stock action adds to the existing quantity. To receive multiple products in one session, close and reopen the modal for each product, or ask your administrator about batch imports.

### 4.3 Transferring Stock Between Locations

Use **Transfer** to move stock from one location to another (e.g. warehouse to store).

1. Click **Transfer** (top right).
2. *(Feature currently under development — form shows "coming soon".)*

### 4.4 Adjusting Stock (Physical Count)

Use **Adjust** after a physical stocktake to correct discrepancies between system and actual counts.

1. Click **Adjust** (top right).
2. *(Feature currently under development — form shows "coming soon".)*

---

## 5. Point of Sale (POS)

**Path:** `/pos`  
**Who can use this:** Admin, Manager, Cashier

The POS is a dedicated full-screen terminal for processing customer sales.

### 5.1 Opening the POS

From any Admin page, click the orange **POS** button in the top bar. The POS opens in a clean two-panel layout optimised for speed.

### 5.2 The POS Screen Layout

| Panel | Contents |
|---|---|
| **Left (Product Grid)** | Searchable grid of all active products |
| **Right (Cart Sidebar)** | Running cart with quantities and totals |

### 5.3 Adding Products to the Cart

**By browsing:**
- Click any product tile in the grid. The product is added to the cart (or its quantity incremented if already there).

**By searching:**
- Type in the **Search products...** box at the top of the grid. The grid filters instantly (300 ms debounce).
- Click the desired product tile.

### 5.4 Managing the Cart

| Action | How |
|---|---|
| Increase quantity | Click **+** next to the item |
| Decrease quantity | Click **−** next to the item (removes item at 0) |
| View line total | Shown to the right of each item |
| Clear everything | Click **Clear Cart** at the bottom of the sidebar |

**Totals panel (bottom of cart):**

| Line | Calculation |
|---|---|
| Subtotal | Sum of all line totals |
| Tax (16%) | 16% VAT on subtotal |
| **Total** | Subtotal + Tax |

### 5.5 Proceeding to Checkout

1. Ensure the cart has at least one item.
2. Click the green **Charge KES X.XX** button at the bottom of the cart.
3. You are taken to the **Checkout** screen.

### 5.6 Checkout & Payment

The checkout screen has two panels:

**Left — Order Summary:**
- Lists all items, quantities, and line totals.
- Shows Subtotal, Tax (16%), and Total.

**Right — Payment Panel:**

1. **Select Location** (required) — choose the store or outlet processing this sale from the dropdown.
2. **Payment line(s):**
   - **Method** — Cash, M-Pesa, Card, Bank Transfer, Credit, or Other.
   - **Amount** — how much is being paid via this method.
   - **Ref** — optional reference (e.g. M-Pesa transaction code, card receipt number).
3. **Split payments:** Click **+ Split payment** to add a second (or more) payment line. Useful when a customer pays partly in cash and partly via M-Pesa.

**Tendered / Change summary:**

| Line | Description |
|---|---|
| Tendered | Sum of all payment amounts entered |
| **Change** (green) | Tendered exceeds Total — give this back to the customer |
| **Short** (red) | Tendered is less than Total — collect more |

4. **Confirm Payment** button activates only when:
   - A location is selected.
   - Cart is not empty.
   - Total tendered ≥ sale total.
5. Click **Confirm Payment**.
   - The system creates the sale record and records all payments.
   - The cart is cleared.
   - You are redirected to the **Receipt** screen.

> **Back to Cart:** If you need to modify the cart, click **Back to Cart** to return without losing anything.

### 5.7 The Receipt Screen

After a successful payment, the receipt is displayed:

- ✅ **Payment Confirmed** heading
- Sale number and timestamp
- Full item list with quantities and line totals
- Subtotal, Discount, Tax, Total, Amount Paid, Change Given

**Printing:** Click **Print Receipt** to trigger the browser's print dialog. The layout is print-optimised.

**New Sale:** Click **New Sale** to return to the POS grid with a fresh, empty cart.

---

## 6. Customers

**Path:** `/admin/customers`  
**Who can use this:** Admin, Manager

### 6.1 Viewing Customers

The customers table shows:

| Column | Description |
|---|---|
| Code | Short customer reference (e.g. C-001) |
| Name | Customer full name or company name |
| Email | Email address |
| Phone | Phone number |
| Segment | retail / wholesale / vip / staff (colour-coded) |
| Balance | Running account balance in KES |
| Status | Active (green) or Inactive (grey) |

**Searching:** Type in the search box to filter by name, email, or phone.

**Filtering by segment:** Use the segment dropdown to view only retail, wholesale, VIP, or staff customers.

### 6.2 Creating a Customer

1. Click **Add Customer**.
2. Fill in:

| Field | Required | Notes |
|---|---|---|
| Name | ✅ | Full name or company name |
| Code | | Short reference code (e.g. C-001) |
| Email | | Must be a valid email format |
| Phone | | Include country code (e.g. +254712345678) |
| Segment | | retail (default), wholesale, vip, staff |
| Credit Limit | | Maximum credit in KES (0 = no credit) |
| Address | | Physical or postal address |

3. Click **Create**.

### 6.3 Editing a Customer

1. Find the customer row.
2. Click the **pencil (✏)** icon.
3. The **Edit Customer** modal opens pre-filled.
4. Make changes.
5. Click **Save**.

> **Note:** Customer **balance** is automatically calculated from completed sales and is not editable directly.

### 6.4 Customer Segments Explained

| Segment | Badge Colour | Typical Use |
|---|---|---|
| **Retail** | Blue | Walk-in individuals |
| **Wholesale** | Indigo | Bulk buyers / trade accounts |
| **VIP** | Gold | High-value or loyalty customers |
| **Staff** | Purple | Internal employee purchases |

---

## 7. Locations

**Path:** `/admin/locations`  
**Who can use this:** Admin, Manager

Locations represent physical or logical places where stock is stored or sales happen.

### 7.1 Viewing Locations

| Column | Description |
|---|---|
| Code | Short identifier (e.g. MAIN, WH-001) |
| Name | Full location name |
| Type | warehouse / store / bin / virtual |
| Address | Physical address |
| Status | Active or Inactive |

### 7.2 Creating a Location

1. Click **Add Location**.
2. Fill in:

| Field | Required | Notes |
|---|---|---|
| Code | ✅ | Short unique code (e.g. WH-001) |
| Name | ✅ | Descriptive name (e.g. Nairobi Warehouse) |
| Type | ✅ | warehouse, store, bin, or virtual |
| Parent Location | | Optional — creates a hierarchy (e.g. a bin inside a warehouse) |
| Address | | Physical address |

3. Click **Create**.

### 7.3 Editing a Location

1. Click the **pencil (✏)** icon on the location row.
2. Modify fields.
3. Click **Save Changes**.

### 7.4 Deactivating a Location

1. Click the **✕** icon on the location row (only shown for active locations).
2. The location is deactivated. It disappears from dropdown menus in the POS and Receive Stock forms.

> **Warning:** Deactivating a location with stock will not delete the stock records, but that stock will no longer appear in the inventory table by default. Reactivate the location to restore visibility.

### 7.5 Location Types Explained

| Type | Badge Colour | When to Use |
|---|---|---|
| **Warehouse** | Blue | Large storage facility, bulk stock |
| **Store** | Green | Retail outlet, customer-facing |
| **Bin** | Grey | Sub-location within a warehouse (shelf, rack) |
| **Virtual** | Purple | Transit, in-transit, adjustment ledger |

---

## 8. Assets

**Path:** `/admin/assets`  
**Who can use this:** Admin, Manager, Asset Manager

Assets are fixed business items that require tracking over their useful life (computers, vehicles, furniture, equipment).

### 8.1 Viewing Assets

| Column | Description |
|---|---|
| Tag | Asset tag number (e.g. AST-001) |
| Name | Asset description |
| Category | Grouping (e.g. IT Equipment, Vehicles) |
| Status | active / in_maintenance / disposed / lost |
| Stage | Lifecycle stage (see below) |
| Cost | Original acquisition cost (KES) |
| Book Value | Current value after depreciation (KES) |

**Searching:** Type in the search box to filter by name or tag number.

**Filtering by status:** Use the status dropdown to show only assets of a given status.

### 8.2 Asset Lifecycle Stages

| Stage | Description |
|---|---|
| **acquired** | Just purchased, not yet deployed |
| **assigned** | Allocated to a user or location |
| **in_service** | Actively in use |
| **under_repair** | Sent for maintenance |
| **decommissioned** | End of life, awaiting disposal |
| **disposed** | Written off / sold / scrapped |

### 8.3 Creating an Asset

1. Click **Add Asset**.
2. Fill in:

| Field | Required | Notes |
|---|---|---|
| Asset Tag | ✅ | Unique identifier (e.g. AST-001) |
| Name | ✅ | Descriptive name (e.g. Dell Laptop XPS) |
| Category | | Grouping label (e.g. IT Equipment) |
| Serial Number | | Manufacturer serial |
| Acquisition Cost | | Purchase price in KES |
| Acquired On | | Date of purchase (date picker) |
| Depreciation Method | | Straight Line, Declining Balance, Units of Production, None |
| Useful Life (months) | | Expected service life (e.g. 36 months = 3 years) |
| Notes | | Any additional information |

3. Click **Create**.

### 8.4 Editing an Asset

1. Click the **pencil (✏)** icon on the asset row.
2. Modify any field.
3. Click **Save Changes**.

### 8.5 Assigning an Asset

Assets can be assigned to a specific user and/or location.

1. Click the **assign** icon on the asset row.
2. Enter the **User ID** of the person receiving the asset.
3. Optionally select a **Location**.
4. Click **Assign**.

> **Note:** The current version requires a User UUID. A user search/picker is planned for a future release.

### 8.6 Depreciation Methods

| Method | How It Works |
|---|---|
| **Straight Line** | Equal depreciation each year: (Cost − Salvage) ÷ Useful Life |
| **Declining Balance** | Higher depreciation in early years, decreasing over time |
| **Units of Production** | Depreciation based on actual usage/output |
| **None** | No automatic depreciation calculated |

---

## 9. Custom Fields

**Path:** `/admin/fields`  
**Who can use this:** Admin only

Custom Fields allow you to extend the standard data model with your own fields, without any code changes. You can add custom fields to **Products**, **Customers**, and **Assets**.

### 9.1 Viewing Custom Fields

Use the **entity type dropdown** at the top to switch between:
- **Product** — extra fields shown on the product form
- **Asset** — extra fields shown on the asset form
- **Customer** — extra fields shown on the customer form

The table shows:

| Column | Description |
|---|---|
| Label | Display name of the field |
| Key | Internal key in `snake_case` (e.g. `brand`, `expiry_date`) |
| Type | Data type (string, number, date, etc.) |
| Required | Whether the field must be filled |
| Section | Optional grouping label |
| Order | Display order in the form |

### 9.2 Creating a Custom Field

1. Select the desired **entity type** from the dropdown.
2. Click **Add Field**.
3. Fill in:

| Field | Required | Notes |
|---|---|---|
| Entity Type | ✅ | product, asset, customer, etc. |
| Field Key | ✅ | Snake_case identifier, e.g. `brand` or `expiry_date` |
| Label | ✅ | Human-readable label shown in forms |
| Data Type | ✅ | See table below |
| Required | | Toggle if the field must always be filled |
| Section | | Group related fields under a heading |
| Display Order | | Lower numbers appear first |

4. Click **Save**.

### 9.3 Data Types

| Type | Example Values | When to Use |
|---|---|---|
| **string** | "Coca-Cola", "Kenya" | Short text |
| **text** | Long descriptions | Multi-line free text |
| **number** | 42, 100 | Whole numbers |
| **decimal** | 3.14, 99.99 | Prices, measurements |
| **boolean** | true / false | Yes/No toggles |
| **date** | 2026-01-15 | Dates without time |
| **datetime** | 2026-01-15T10:30:00 | Dates with time |
| **enum** | "Red", "Blue", "Green" | Dropdown from fixed options |
| **reference** | UUID | Link to another entity |
| **json** | `{"key": "value"}` | Structured data |

### 9.4 Deleting a Custom Field

Click the **🗑 (bin)** icon on the field row. The field is soft-deleted (hidden, not permanently removed).

---

## 10. Business Rules

**Path:** `/admin/rules`  
**Who can use this:** Admin only

The Rules Engine lets you define automated business logic that runs in response to events, data entry, or decisions — without writing code.

### 10.1 Rule Engines

| Engine | Purpose | Example |
|---|---|---|
| **Reactive** | Triggered by system events | "When stock falls below reorder point, alert the manager" |
| **Validation** | Validate data on entry | "Sale total must not exceed customer credit limit" |
| **Decision** | Evaluate conditions and return outcomes | "If customer segment = wholesale, apply 10% discount" |
| **Policy** | Enforce business policies | "Cash sales only for amounts under KES 1,000" |

### 10.2 Viewing Rules

Rules are listed in a table. Use the **engine tabs** (All / Reactive / Decision / Validation / Policy) to filter.

| Column | Description |
|---|---|
| Name | Rule name |
| Engine | reactive / decision / validation / policy |
| Trigger | Event that fires the rule (reactive rules only) |
| Priority | Lower number = higher priority |
| Status | Draft (inactive) or Active |

### 10.3 Creating a Rule

1. Click **New Rule**.
2. Fill in the **Rule Form**:

| Field | Required | Notes |
|---|---|---|
| Name | ✅ | Descriptive name |
| Engine | ✅ | Reactive, Decision, Validation, Policy |
| Trigger Event | | For reactive rules (e.g. `stock.below_reorder`) |
| Priority | | 1–1000; lower = runs first (default: 100) |
| Description | | Plain English explanation |
| Rule Body (JSON) | ✅ | Engine-specific JSON rule definition |

3. Click **Save Rule**.
4. The rule is saved in **Draft** status (not yet active).

### 10.4 Activating / Deactivating a Rule

- **Activate:** Click the **Activate** button on a Draft rule. Status changes to Active.
- **Deactivate:** Click the **Deactivate** button on an Active rule. Status reverts to Draft.

> Only **Active** rules are evaluated by the system at runtime.

### 10.5 AI Rule Assistance (Coming Soon)

The **AI Assist** toggle in the New Rule modal will allow you to describe a rule in plain English and have it converted to a structured rule definition automatically. This feature is planned for a future release.

---

## 11. Settings

**Path:** `/admin/settings`  
**Who can use this:** Admin only

Settings store configurable values that control system behaviour. They support three scope levels:

| Scope | Description | Example |
|---|---|---|
| **tenant** | Applies to the entire workspace | `currency = KES` |
| **location** | Applies to a specific location only | Tax rate for a specific outlet |
| **user** | Applies to a specific user | UI preferences |

### 11.1 Viewing Settings

The settings table shows:

| Column | Description |
|---|---|
| Key | Setting identifier (e.g. `currency`, `tax_rate`) |
| Scope | tenant / location / user |
| Scope ID | UUID of the location or user (blank for tenant) |
| Value | Current value (JSON format) |

### 11.2 Creating or Updating a Setting

Settings use **upsert** semantics — creating a setting with an existing key+scope combination updates it rather than creating a duplicate.

1. Click the **+** button (or the **edit ✎** icon on an existing row).
2. Fill in:

| Field | Required | Notes |
|---|---|---|
| Scope | ✅ | tenant, location, or user |
| Scope ID | | UUID — leave blank for tenant-wide settings |
| Key | ✅ | Identifier in dot notation (e.g. `receipt.footer`) |
| Value (JSON) | ✅ | Valid JSON: `"KES"`, `0.16`, `true`, `{"key": "value"}` |

3. Click **Save**.

### 11.3 Recommended Settings to Configure

| Key | Suggested Value | Description |
|---|---|---|
| `currency` | `"KES"` | Display currency |
| `tax_rate` | `0.16` | VAT rate (16% = 0.16) |
| `receipt.footer` | `"Thank you for shopping with us!"` | Receipt footer message |
| `receipt.header` | `"Your Company Name"` | Receipt header / logo text |

---

## 12. User Roles & Permissions

The platform uses **role-based access control** (RBAC). Each user is assigned one or more roles that determine what they can do.

| Role | Can Do |
|---|---|
| **admin** | Full access to all features and settings |
| **manager** | All operational tasks: products, inventory, customers, locations, assets, POS |
| **stock_manager** | Receive stock, view inventory; cannot manage products or settings |
| **cashier** | Use the POS terminal, create and complete sales only |
| **asset_manager** | View, create and update assets; cannot access sales or customers |

### Permission Matrix

| Feature | admin | manager | stock_manager | cashier | asset_manager |
|---|:---:|:---:|:---:|:---:|:---:|
| View Products | ✅ | ✅ | ✅ | ✅ | — |
| Create/Edit Products | ✅ | ✅ | ✅ | — | — |
| Deactivate Products | ✅ | ✅ | — | — | — |
| View Inventory | ✅ | ✅ | ✅ | — | — |
| Receive / Transfer Stock | ✅ | ✅ | ✅ | — | — |
| Use POS | ✅ | ✅ | — | ✅ | — |
| Void Sales | ✅ | ✅ | — | ✅ | — |
| Process Returns | ✅ | ✅ | — | — | — |
| View Customers | ✅ | ✅ | — | — | — |
| Create/Edit Customers | ✅ | ✅ | — | — | — |
| Manage Locations | ✅ | ✅ | — | — | — |
| Manage Assets | ✅ | ✅ | — | — | ✅ |
| Custom Fields | ✅ | — | — | — | — |
| Business Rules | ✅ | — | — | — | — |
| Settings | ✅ | — | — | — | — |

---

## 13. Business Process Workflows

### 13.1 New Stock Arrival (Goods-In Process)

**Who:** Stock Manager / Manager  
**When:** New inventory arrives from a supplier

**Step-by-step:**

1. Obtain the supplier's delivery note or purchase order.
2. Navigate to **Inventory** → click **Receive Stock**.
3. For each product in the delivery:
   a. Select the **Product** from the dropdown.
   b. Select the **Location** (the warehouse or store receiving the goods).
   c. Enter the **Quantity** received.
   d. Enter the **Notes** field with the PO or delivery reference number.
   e. Click **Receive Stock**.
4. Repeat for each product line.
5. Verify the updated quantities in the **Inventory** table.
6. File the physical delivery note with your records.

---

### 13.2 Making a Sale (Cashier Process)

**Who:** Cashier / Manager / Admin  
**When:** A customer is purchasing at the till

**Step-by-step:**

1. Navigate to **POS** (click the orange POS button in the top bar).
2. Search for or browse to the first product. Click it to add to cart.
3. Continue adding products. Adjust quantities using **+/−**.
4. Once all items are in the cart, verify the **Total** at the bottom.
5. Click **Charge KES X.XX**.
6. On the Checkout screen:
   a. Select the **Location** (your store/outlet).
   b. Choose the **Payment Method**.
   c. Enter the **Amount** tendered.
   d. For M-Pesa: enter the transaction reference in the **Ref** field.
   e. For split payments: click **+ Split payment** and add a second line.
7. Confirm the **Change** or **Tendered** amounts are correct.
8. Click **Confirm Payment**.
9. The receipt appears. Click **Print Receipt** if a hard copy is needed.
10. Click **New Sale** to start the next transaction.

---

### 13.3 Adding a New Product to the Catalogue

**Who:** Admin / Manager  
**When:** A new product is sourced and needs to be sold

**Step-by-step:**

1. Navigate to **Products** → click **Add Product**.
2. Assign a unique **SKU** (e.g. ELEC-003).
3. Enter the **Name**, **Category**, **Selling Price**, and **Cost Price**.
4. Set **Reorder Point** and **Reorder Qty** to enable low-stock alerts.
5. Click **Create Product**.
6. The product immediately appears in the POS product grid.
7. Receive initial stock: go to **Inventory** → **Receive Stock** and add opening quantities.

---

### 13.4 Stock Transfer Between Locations

**Who:** Stock Manager / Manager  
**When:** Moving goods from the warehouse to a store

*(Transfer form is under development. Use the API or await UI release.)*

**Process overview:**
1. Confirm quantities available at the source location.
2. Navigate to **Inventory** → click **Transfer**.
3. Select **From Location**, **To Location**, product(s) and quantity.
4. Add a reference note.
5. Submit. Both locations update simultaneously.

---

### 13.5 Physical Stocktake / Inventory Adjustment

**Who:** Stock Manager / Manager  
**When:** Periodic physical count or shrinkage correction

*(Adjust form is under development. Use the API or await UI release.)*

**Process overview:**
1. Print or export current stock levels from the **Inventory** table.
2. Physically count stock at each location.
3. Navigate to **Inventory** → click **Adjust**.
4. For each discrepancy, enter the **Counted Quantity** and a **Reason** (e.g. "Shrinkage", "Damage", "Found stock").
5. Submit. The system sets quantities to the counted values and records the variance.

---

### 13.6 Setting Up a New Location (Opening a Branch)

**Who:** Admin / Manager  
**When:** A new outlet or warehouse is being commissioned

**Step-by-step:**

1. Navigate to **Locations** → click **Add Location**.
2. Assign a **Code** (e.g. MOMBASA-01) and **Name** (e.g. Mombasa Branch).
3. Select **Type** = Store (or Warehouse as appropriate).
4. Enter the physical **Address**.
5. Click **Create**.
6. Receive opening stock: **Inventory** → **Receive Stock** → select the new location.
7. Cashiers can now select this location in the POS checkout.

---

### 13.7 Registering and Tracking a Business Asset

**Who:** Admin / Manager / Asset Manager  
**When:** A new capital item is purchased (laptop, vehicle, equipment)

**Step-by-step:**

1. Navigate to **Assets** → click **Add Asset**.
2. Enter the **Asset Tag** (affix a physical label to the item with the same number).
3. Fill in **Name**, **Category**, **Serial Number**, and **Acquisition Cost**.
4. Set the **Acquired On** date.
5. Select the **Depreciation Method** and **Useful Life** in months.
6. Click **Create**.
7. To assign to a staff member: click the assign icon, enter the user's ID.
8. Monitor **Book Value** over time as depreciation is calculated.
9. When the asset is no longer needed, edit its **status** to `disposed`.

---

### 13.8 Extending Product Data with Custom Fields

**Who:** Admin  
**When:** Standard product fields are insufficient for your catalogue

**Example — Adding a "Brand" field to all products:**

1. Navigate to **Custom Fields** → select entity type **Product** from the dropdown.
2. Click **Add Field**.
3. Set:
   - **Field Key:** `brand`
   - **Label:** Brand
   - **Data Type:** string
   - **Required:** off (optional)
4. Click **Save**.
5. The "Brand" field now appears on the Product create/edit forms.
6. Edit each product to fill in the brand name.

---

### 13.9 Configuring a Low-Stock Alert Rule

**Who:** Admin  
**When:** You want the system to react when stock runs low

**Step-by-step:**

1. Navigate to **Rules** → click **New Rule**.
2. Set:
   - **Name:** Low Stock Alert
   - **Engine:** Reactive
   - **Trigger Event:** `stock.below_reorder`
   - **Priority:** 100
   - **Description:** Notify manager when a product falls below its reorder point
   - **Rule Body (JSON):**
     ```json
     {
       "action": "notify",
       "channel": "email",
       "template": "low_stock"
     }
     ```
3. Click **Save Rule**.
4. Click **Activate** on the rule row.
5. The rule is now live and will fire when stock drops below the reorder point.

---

### 13.10 Processing an M-Pesa Payment

**Who:** Cashier  
**When:** A customer pays via M-Pesa Lipa na M-Pesa / STK Push

**Step-by-step:**

1. Build the cart in the POS as usual.
2. On the Checkout screen, select **M-Pesa** as the payment method.
3. Enter the **Amount**.
4. In the **Ref** field, enter the M-Pesa transaction code provided by the customer (e.g. `RGK2XYZ5AB`).
5. Click **Confirm Payment**.
6. *(For automated STK Push — where the system sends a payment prompt to the customer's phone — this is configured at the API level with Safaricom credentials. Contact your administrator to enable this.)*

---

### 13.11 Handling a Split Payment

**Who:** Cashier  
**When:** A customer pays using more than one payment method

**Example — KES 1,500 total: KES 1,000 cash + KES 500 M-Pesa**

1. On the Checkout screen, the first payment line is pre-filled (e.g. Cash, 1,500).
2. Change the first line: **Method** = Cash, **Amount** = 1000.
3. Click **+ Split payment**.
4. Set the second line: **Method** = M-Pesa, **Amount** = 500, **Ref** = (M-Pesa code).
5. Verify **Tendered** = 1,500 and **Change** = 0.
6. Click **Confirm Payment**.

---

### 13.12 Daily Opening Checklist (Recommended)

For cashiers and store managers at the start of each day:

- [ ] Log in and navigate to **Inventory** — check for any items in red (low stock).
- [ ] Verify your **Location** is active under **Locations**.
- [ ] Open the **POS** and confirm product prices look correct.
- [ ] Conduct a brief spot-check of high-value items against system quantities.
- [ ] If stock has arrived overnight, process **Receive Stock** before opening.

---

*Document generated: April 2026 | Ledger Atlas v1.0*
