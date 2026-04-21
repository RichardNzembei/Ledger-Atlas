export type FieldDataType = 'string' | 'text' | 'number' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'enum' | 'json' | 'reference';
export type EntityType = 'product' | 'customer' | 'asset';

export interface TemplateField {
  fieldKey: string;
  label: string;
  dataType: FieldDataType;
  isRequired: boolean;
  section: string;
  displayOrder: number;
  config?: {
    options?: Array<{ value: string; label: string }>;
    referenceEntity?: string;
  };
  notes?: string;
}

export interface VerticalEntitySection {
  entity: EntityType;
  label: string;
  fields: TemplateField[];
}

export interface VerticalTemplate {
  id: string;
  name: string;
  description: string;
  entities: VerticalEntitySection[];
}

function opts(values: string[]): Array<{ value: string; label: string }> {
  return values.map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
}

const VERTICALS: VerticalTemplate[] = [
  // ─── 1. Pharmacy ───────────────────────────────────────────────────────────
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Regulated retail with batch tracking, cold chain, and insurance workflows',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'generic_name', label: 'Generic name', dataType: 'string', isRequired: false, section: 'Drug info', displayOrder: 10 },
          { fieldKey: 'active_ingredient', label: 'Active ingredient', dataType: 'string', isRequired: true, section: 'Drug info', displayOrder: 20 },
          { fieldKey: 'strength', label: 'Strength', dataType: 'string', isRequired: true, section: 'Drug info', displayOrder: 30 },
          { fieldKey: 'dosage_form', label: 'Dosage form', dataType: 'enum', isRequired: true, section: 'Drug info', displayOrder: 40, config: { options: opts(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'suppository']) } },
          { fieldKey: 'pack_size', label: 'Pack size', dataType: 'string', isRequired: true, section: 'Drug info', displayOrder: 50 },
          { fieldKey: 'schedule', label: 'Prescription schedule', dataType: 'enum', isRequired: true, section: 'Regulatory', displayOrder: 60, config: { options: opts(['OTC', 'POM', 'controlled']) } },
          { fieldKey: 'requires_batch_tracking', label: 'Requires batch tracking', dataType: 'boolean', isRequired: true, section: 'Regulatory', displayOrder: 70 },
          { fieldKey: 'requires_refrigeration', label: 'Cold chain required', dataType: 'boolean', isRequired: false, section: 'Storage', displayOrder: 80 },
          { fieldKey: 'storage_temperature_min', label: 'Min storage temp (°C)', dataType: 'number', isRequired: false, section: 'Storage', displayOrder: 90 },
          { fieldKey: 'storage_temperature_max', label: 'Max storage temp (°C)', dataType: 'number', isRequired: false, section: 'Storage', displayOrder: 100 },
          { fieldKey: 'manufacturer', label: 'Manufacturer', dataType: 'string', isRequired: false, section: 'Sourcing', displayOrder: 110 },
          { fieldKey: 'country_of_origin', label: 'Country of origin', dataType: 'string', isRequired: false, section: 'Sourcing', displayOrder: 120 },
          { fieldKey: 'pharmacy_board_reg_no', label: 'PPB registration number', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 130 },
          { fieldKey: 'narcotic_schedule', label: 'Narcotic classification', dataType: 'enum', isRequired: false, section: 'Regulatory', displayOrder: 140, config: { options: opts(['none', 'schedule_i', 'schedule_ii', 'schedule_iii', 'schedule_iv']) } },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'nhif_number', label: 'NHIF / SHA number', dataType: 'string', isRequired: false, section: 'Insurance', displayOrder: 10 },
          { fieldKey: 'insurance_provider', label: 'Insurance provider', dataType: 'string', isRequired: false, section: 'Insurance', displayOrder: 20 },
          { fieldKey: 'insurance_policy_no', label: 'Policy number', dataType: 'string', isRequired: false, section: 'Insurance', displayOrder: 30 },
          { fieldKey: 'chronic_patient', label: 'Chronic condition patient', dataType: 'boolean', isRequired: false, section: 'Medical', displayOrder: 40 },
          { fieldKey: 'chronic_conditions', label: 'Chronic conditions', dataType: 'json', isRequired: false, section: 'Medical', displayOrder: 50 },
          { fieldKey: 'allergies_warnings', label: 'Known allergies / warnings', dataType: 'text', isRequired: false, section: 'Medical', displayOrder: 60 },
          { fieldKey: 'preferred_pharmacist', label: 'Preferred pharmacist', dataType: 'reference', isRequired: false, section: 'Preferences', displayOrder: 70, config: { referenceEntity: 'user' } },
          { fieldKey: 'prescription_delivery', label: 'Delivery preferred', dataType: 'boolean', isRequired: false, section: 'Preferences', displayOrder: 80 },
        ],
      },
    ],
  },

  // ─── 2. Hardware Store ──────────────────────────────────────────────────────
  {
    id: 'hardware',
    name: 'Hardware Store',
    description: 'Mid-market retail with dimensions, supplier complexity, and contractor customers',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'brand', label: 'Brand', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 10 },
          { fieldKey: 'model_number', label: 'Model number', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 20 },
          { fieldKey: 'barcode_ean', label: 'Barcode (EAN/UPC)', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 30 },
          { fieldKey: 'weight_kg', label: 'Weight (kg)', dataType: 'decimal', isRequired: false, section: 'Dimensions', displayOrder: 40 },
          { fieldKey: 'length_cm', label: 'Length (cm)', dataType: 'decimal', isRequired: false, section: 'Dimensions', displayOrder: 50 },
          { fieldKey: 'width_cm', label: 'Width (cm)', dataType: 'decimal', isRequired: false, section: 'Dimensions', displayOrder: 60 },
          { fieldKey: 'height_cm', label: 'Height (cm)', dataType: 'decimal', isRequired: false, section: 'Dimensions', displayOrder: 70 },
          { fieldKey: 'volume_cubic_m', label: 'Volume (m³)', dataType: 'decimal', isRequired: false, section: 'Dimensions', displayOrder: 80 },
          { fieldKey: 'material', label: 'Primary material', dataType: 'enum', isRequired: false, section: 'Specifications', displayOrder: 90, config: { options: opts(['wood', 'metal', 'plastic', 'composite', 'other']) } },
          { fieldKey: 'color', label: 'Color', dataType: 'string', isRequired: false, section: 'Specifications', displayOrder: 100 },
          { fieldKey: 'power_rating_watts', label: 'Power rating (W)', dataType: 'number', isRequired: false, section: 'Specifications', displayOrder: 110 },
          { fieldKey: 'voltage', label: 'Voltage (V)', dataType: 'enum', isRequired: false, section: 'Specifications', displayOrder: 120, config: { options: opts(['12', '24', '110', '220', '240', 'dual', 'other']) } },
          { fieldKey: 'warranty_months', label: 'Warranty (months)', dataType: 'number', isRequired: false, section: 'After-sales', displayOrder: 130 },
          { fieldKey: 'default_supplier', label: 'Default supplier', dataType: 'reference', isRequired: false, section: 'Sourcing', displayOrder: 140, config: { referenceEntity: 'vendor' } },
          { fieldKey: 'alternative_suppliers', label: 'Alternative suppliers', dataType: 'json', isRequired: false, section: 'Sourcing', displayOrder: 150 },
          { fieldKey: 'country_of_origin', label: 'Country of origin', dataType: 'string', isRequired: false, section: 'Sourcing', displayOrder: 160 },
          { fieldKey: 'import_duty_category', label: 'Import duty category', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 170 },
          { fieldKey: 'hs_code', label: 'HS code', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 180 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'business_type', label: 'Business type', dataType: 'enum', isRequired: false, section: 'Segmentation', displayOrder: 10, config: { options: opts(['contractor', 'developer', 'individual', 'reseller', 'ngo', 'government']) } },
          { fieldKey: 'kra_pin', label: 'KRA PIN', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 20 },
          { fieldKey: 'business_reg_no', label: 'Business reg number', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 30 },
          { fieldKey: 'project_codes', label: 'Current project codes', dataType: 'json', isRequired: false, section: 'Operations', displayOrder: 40 },
          { fieldKey: 'credit_terms_days', label: 'Credit terms (days)', dataType: 'number', isRequired: false, section: 'Credit', displayOrder: 50 },
          { fieldKey: 'preferred_delivery_address', label: 'Preferred delivery address', dataType: 'text', isRequired: false, section: 'Logistics', displayOrder: 60 },
        ],
      },
    ],
  },

  // ─── 3. Electronics Retail ──────────────────────────────────────────────────
  {
    id: 'electronics',
    name: 'Electronics Retail',
    description: 'Warranty, serial/IMEI tracking, and after-sales service for electronics',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'brand', label: 'Brand', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 10 },
          { fieldKey: 'model_number', label: 'Model', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 20 },
          { fieldKey: 'imei_required', label: 'Requires IMEI tracking', dataType: 'boolean', isRequired: true, section: 'Identification', displayOrder: 30 },
          { fieldKey: 'serial_required', label: 'Requires serial tracking', dataType: 'boolean', isRequired: true, section: 'Identification', displayOrder: 40 },
          { fieldKey: 'year_of_release', label: 'Year of release', dataType: 'number', isRequired: false, section: 'Identification', displayOrder: 50 },
          { fieldKey: 'warranty_months', label: 'Warranty period (months)', dataType: 'number', isRequired: true, section: 'After-sales', displayOrder: 60 },
          { fieldKey: 'warranty_type', label: 'Warranty type', dataType: 'enum', isRequired: false, section: 'After-sales', displayOrder: 70, config: { options: opts(['manufacturer', 'retailer', 'extended', 'none']) } },
          { fieldKey: 'warranty_call_center', label: 'Warranty service number', dataType: 'string', isRequired: false, section: 'After-sales', displayOrder: 80 },
          { fieldKey: 'return_window_days', label: 'Return window (days)', dataType: 'number', isRequired: false, section: 'After-sales', displayOrder: 90 },
          { fieldKey: 'specifications', label: 'Specifications', dataType: 'json', isRequired: false, section: 'Technical', displayOrder: 100 },
          { fieldKey: 'color_options', label: 'Color options', dataType: 'enum', isRequired: false, section: 'Variant', displayOrder: 110, config: { options: opts(['black', 'white', 'silver', 'gold', 'blue', 'red', 'green', 'other']) } },
          { fieldKey: 'storage_capacity_gb', label: 'Storage (GB)', dataType: 'number', isRequired: false, section: 'Variant', displayOrder: 120 },
          { fieldKey: 'ram_gb', label: 'RAM (GB)', dataType: 'number', isRequired: false, section: 'Variant', displayOrder: 130 },
          { fieldKey: 'screen_size_inches', label: 'Screen size (inches)', dataType: 'decimal', isRequired: false, section: 'Variant', displayOrder: 140 },
          { fieldKey: 'is_refurbished', label: 'Is refurbished', dataType: 'boolean', isRequired: false, section: 'Condition', displayOrder: 150 },
          { fieldKey: 'energy_rating', label: 'Energy rating', dataType: 'enum', isRequired: false, section: 'Regulatory', displayOrder: 160, config: { options: [{ value: 'A+++', label: 'A+++' }, { value: 'A++', label: 'A++' }, { value: 'A+', label: 'A+' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'D', label: 'D' }] } },
          { fieldKey: 'kebs_approval_no', label: 'KEBS approval number', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 170 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'warranty_contact_phone', label: 'Warranty contact phone', dataType: 'string', isRequired: false, section: 'After-sales', displayOrder: 10 },
          { fieldKey: 'preferred_service_center', label: 'Preferred service center', dataType: 'reference', isRequired: false, section: 'After-sales', displayOrder: 20, config: { referenceEntity: 'location' } },
          { fieldKey: 'extended_warranty_purchases', label: 'Extended warranties held', dataType: 'json', isRequired: false, section: 'After-sales', displayOrder: 30 },
        ],
      },
    ],
  },

  // ─── 4. Agricultural Inputs ─────────────────────────────────────────────────
  {
    id: 'agri',
    name: 'Agricultural Inputs',
    description: 'Seeds, fertilizers, pesticides, and vet supplies — seasonal, regulated, farmer-facing',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'category_ag', label: 'Ag category', dataType: 'enum', isRequired: true, section: 'Classification', displayOrder: 10, config: { options: opts(['seed', 'fertilizer', 'pesticide', 'herbicide', 'fungicide', 'veterinary', 'feed', 'equipment']) } },
          { fieldKey: 'crop_suitability', label: 'Suitable crops', dataType: 'json', isRequired: false, section: 'Classification', displayOrder: 20 },
          { fieldKey: 'season_suitability', label: 'Suitable seasons', dataType: 'enum', isRequired: false, section: 'Classification', displayOrder: 30, config: { options: opts(['long_rains', 'short_rains', 'dry', 'any']) } },
          { fieldKey: 'brand_variety', label: 'Brand / variety', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 40 },
          { fieldKey: 'active_ingredient', label: 'Active ingredient', dataType: 'string', isRequired: false, section: 'Composition', displayOrder: 50 },
          { fieldKey: 'concentration', label: 'Concentration', dataType: 'string', isRequired: false, section: 'Composition', displayOrder: 60 },
          { fieldKey: 'application_rate', label: 'Application rate', dataType: 'string', isRequired: false, section: 'Usage', displayOrder: 70 },
          { fieldKey: 'phi_days', label: 'Pre-harvest interval (days)', dataType: 'number', isRequired: false, section: 'Safety', displayOrder: 80 },
          { fieldKey: 'toxicity_class', label: 'Toxicity class', dataType: 'enum', isRequired: false, section: 'Safety', displayOrder: 90, config: { options: [{ value: 'I', label: 'Class I' }, { value: 'II', label: 'Class II' }, { value: 'III', label: 'Class III' }, { value: 'IV', label: 'Class IV' }] } },
          { fieldKey: 'ppe_required', label: 'PPE required', dataType: 'text', isRequired: false, section: 'Safety', displayOrder: 100 },
          { fieldKey: 'pcpb_registration_no', label: 'PCPB registration number', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 110 },
          { fieldKey: 'kebs_standard', label: 'KEBS standard ref', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 120 },
          { fieldKey: 'batch_required', label: 'Batch tracking required', dataType: 'boolean', isRequired: true, section: 'Regulatory', displayOrder: 130 },
          { fieldKey: 'requires_cold_storage', label: 'Cold storage required', dataType: 'boolean', isRequired: false, section: 'Storage', displayOrder: 140 },
          { fieldKey: 'shelf_life_months', label: 'Shelf life (months)', dataType: 'number', isRequired: false, section: 'Storage', displayOrder: 150 },
          { fieldKey: 'pack_size', label: 'Pack size', dataType: 'string', isRequired: true, section: 'Packaging', displayOrder: 160 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'farm_size_acres', label: 'Farm size (acres)', dataType: 'decimal', isRequired: false, section: 'Farm', displayOrder: 10 },
          { fieldKey: 'primary_crops', label: 'Primary crops', dataType: 'json', isRequired: false, section: 'Farm', displayOrder: 20 },
          { fieldKey: 'livestock_types', label: 'Livestock types', dataType: 'json', isRequired: false, section: 'Farm', displayOrder: 30 },
          { fieldKey: 'cooperative_id', label: 'Cooperative membership', dataType: 'string', isRequired: false, section: 'Affiliation', displayOrder: 40 },
          { fieldKey: 'extension_officer', label: 'Extension officer', dataType: 'string', isRequired: false, section: 'Support', displayOrder: 50 },
          { fieldKey: 'farm_location_ward', label: 'Farm location (ward)', dataType: 'string', isRequired: false, section: 'Logistics', displayOrder: 60 },
          {
            fieldKey: 'farm_county',
            label: 'County',
            dataType: 'enum',
            isRequired: false,
            section: 'Logistics',
            displayOrder: 70,
            config: {
              options: opts([
                'Mombasa', 'Kwale', 'Kilifi', 'Tana_River', 'Lamu', 'Taita_Taveta',
                'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
                'Tharaka_Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni',
                'Nyandarua', 'Nyeri', 'Kirinyaga', 'Muranga', 'Kiambu',
                'Turkana', 'West_Pokot', 'Samburu', 'Trans_Nzoia', 'Uasin_Gishu',
                'Elgeyo_Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
                'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga',
                'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa_Bay', 'Migori',
                'Kisii', 'Nyamira', 'Nairobi',
              ]),
            },
          },
        ],
      },
    ],
  },

  // ─── 5. Restaurant / Café ───────────────────────────────────────────────────
  {
    id: 'restaurant',
    name: 'Restaurant / Café',
    description: 'Menu items, recipe costing, kitchen stations, and dietary flags',
    entities: [
      {
        entity: 'product',
        label: 'Menu Items',
        fields: [
          { fieldKey: 'menu_section', label: 'Menu section', dataType: 'enum', isRequired: true, section: 'Menu', displayOrder: 10, config: { options: opts(['appetizer', 'main', 'dessert', 'drink', 'side', 'breakfast', 'combo']) } },
          { fieldKey: 'dietary_flags', label: 'Dietary flags', dataType: 'json', isRequired: false, section: 'Menu', displayOrder: 20 },
          { fieldKey: 'spice_level', label: 'Spice level', dataType: 'enum', isRequired: false, section: 'Menu', displayOrder: 30, config: { options: opts(['none', 'mild', 'medium', 'hot', 'extra_hot']) } },
          { fieldKey: 'prep_time_minutes', label: 'Prep time (minutes)', dataType: 'number', isRequired: false, section: 'Operations', displayOrder: 40 },
          { fieldKey: 'recipe', label: 'Recipe (ingredients)', dataType: 'json', isRequired: false, section: 'Recipe', displayOrder: 50 },
          { fieldKey: 'recipe_yield', label: 'Recipe yield', dataType: 'number', isRequired: false, section: 'Recipe', displayOrder: 60 },
          { fieldKey: 'is_customizable', label: 'Customizable', dataType: 'boolean', isRequired: false, section: 'Menu', displayOrder: 70 },
          { fieldKey: 'modifiers_available', label: 'Available modifiers', dataType: 'json', isRequired: false, section: 'Menu', displayOrder: 80 },
          { fieldKey: 'is_kids_menu', label: 'Kids menu', dataType: 'boolean', isRequired: false, section: 'Menu', displayOrder: 90 },
          { fieldKey: 'is_alcohol', label: 'Contains alcohol', dataType: 'boolean', isRequired: false, section: 'Regulatory', displayOrder: 100 },
          { fieldKey: 'kitchen_station', label: 'Kitchen station', dataType: 'enum', isRequired: false, section: 'Operations', displayOrder: 110, config: { options: opts(['grill', 'fryer', 'cold_kitchen', 'bar', 'barista']) } },
          { fieldKey: 'availability_schedule', label: 'Availability schedule', dataType: 'json', isRequired: false, section: 'Menu', displayOrder: 120 },
          { fieldKey: 'image_url', label: 'Menu image', dataType: 'string', isRequired: false, section: 'Menu', displayOrder: 130 },
          { fieldKey: 'calories', label: 'Calories per serving', dataType: 'number', isRequired: false, section: 'Nutrition', displayOrder: 140 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'favorite_orders', label: 'Favorite orders', dataType: 'json', isRequired: false, section: 'Preferences', displayOrder: 10 },
          { fieldKey: 'dietary_restrictions', label: 'Dietary restrictions', dataType: 'json', isRequired: false, section: 'Preferences', displayOrder: 20 },
          { fieldKey: 'allergies', label: 'Known allergies', dataType: 'text', isRequired: false, section: 'Medical', displayOrder: 30 },
          { fieldKey: 'loyalty_visits', label: 'Loyalty visit count', dataType: 'number', isRequired: false, section: 'Loyalty', displayOrder: 40 },
          { fieldKey: 'typical_table_size', label: 'Typical party size', dataType: 'number', isRequired: false, section: 'Preferences', displayOrder: 50 },
        ],
      },
    ],
  },

  // ─── 6. Fashion / Apparel ───────────────────────────────────────────────────
  {
    id: 'fashion',
    name: 'Fashion / Apparel',
    description: 'Variants, seasons, trend cycles, and personal styling for fashion retail',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'brand', label: 'Brand', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 10 },
          { fieldKey: 'collection', label: 'Collection / season', dataType: 'string', isRequired: false, section: 'Catalog', displayOrder: 20 },
          { fieldKey: 'year', label: 'Year', dataType: 'number', isRequired: false, section: 'Catalog', displayOrder: 30 },
          { fieldKey: 'season', label: 'Season', dataType: 'enum', isRequired: false, section: 'Catalog', displayOrder: 40, config: { options: opts(['spring', 'summer', 'autumn', 'winter', 'all_season']) } },
          { fieldKey: 'gender', label: 'Target gender', dataType: 'enum', isRequired: false, section: 'Catalog', displayOrder: 50, config: { options: opts(['mens', 'womens', 'unisex', 'kids_boys', 'kids_girls', 'kids_unisex']) } },
          { fieldKey: 'age_group', label: 'Age group', dataType: 'enum', isRequired: false, section: 'Catalog', displayOrder: 60, config: { options: opts(['infant', 'toddler', 'kids', 'teen', 'adult']) } },
          { fieldKey: 'size', label: 'Size', dataType: 'enum', isRequired: false, section: 'Variant', displayOrder: 70, config: { options: opts(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']) } },
          { fieldKey: 'color', label: 'Color', dataType: 'string', isRequired: false, section: 'Variant', displayOrder: 80 },
          { fieldKey: 'fabric', label: 'Primary fabric', dataType: 'enum', isRequired: false, section: 'Material', displayOrder: 90, config: { options: opts(['cotton', 'polyester', 'blend', 'denim', 'silk', 'wool', 'leather', 'synthetic', 'other']) } },
          { fieldKey: 'fabric_composition', label: 'Fabric composition', dataType: 'string', isRequired: false, section: 'Material', displayOrder: 100 },
          { fieldKey: 'care_instructions', label: 'Care instructions', dataType: 'text', isRequired: false, section: 'Material', displayOrder: 110 },
          { fieldKey: 'country_of_origin', label: 'Country of origin', dataType: 'string', isRequired: false, section: 'Sourcing', displayOrder: 120 },
          { fieldKey: 'style_category', label: 'Style category', dataType: 'enum', isRequired: false, section: 'Catalog', displayOrder: 130, config: { options: opts(['casual', 'formal', 'sports', 'sleepwear', 'swimwear', 'outerwear', 'accessories']) } },
          { fieldKey: 'is_end_of_season', label: 'End of season / clearance', dataType: 'boolean', isRequired: false, section: 'Lifecycle', displayOrder: 140 },
          { fieldKey: 'reorderable', label: 'Can be reordered', dataType: 'boolean', isRequired: false, section: 'Lifecycle', displayOrder: 150 },
          { fieldKey: 'parent_style_id', label: 'Parent style ID', dataType: 'string', isRequired: false, section: 'Variant', displayOrder: 160 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'preferred_sizes', label: 'Preferred sizes', dataType: 'json', isRequired: false, section: 'Preferences', displayOrder: 10 },
          { fieldKey: 'style_preferences', label: 'Style preferences', dataType: 'json', isRequired: false, section: 'Preferences', displayOrder: 20 },
          { fieldKey: 'color_preferences', label: 'Color preferences', dataType: 'json', isRequired: false, section: 'Preferences', displayOrder: 30 },
          { fieldKey: 'stylist_assigned', label: 'Stylist', dataType: 'reference', isRequired: false, section: 'VIP', displayOrder: 40, config: { referenceEntity: 'user' } },
          { fieldKey: 'fitting_notes', label: 'Fitting notes', dataType: 'text', isRequired: false, section: 'VIP', displayOrder: 50 },
        ],
      },
    ],
  },

  // ─── 7. Professional Services ───────────────────────────────────────────────
  {
    id: 'field_services',
    name: 'Professional Services',
    description: 'Job-based operations with assets, technicians, and service contracts',
    entities: [
      {
        entity: 'product',
        label: 'Services',
        fields: [
          { fieldKey: 'service_category', label: 'Service category', dataType: 'enum', isRequired: true, section: 'Classification', displayOrder: 10, config: { options: opts(['installation', 'maintenance', 'repair', 'inspection', 'consultation', 'emergency']) } },
          { fieldKey: 'billing_basis', label: 'Billing basis', dataType: 'enum', isRequired: true, section: 'Pricing', displayOrder: 20, config: { options: opts(['per_hour', 'per_visit', 'per_project', 'fixed_price', 'per_unit']) } },
          { fieldKey: 'default_duration_hours', label: 'Default duration (hours)', dataType: 'decimal', isRequired: false, section: 'Operations', displayOrder: 30 },
          { fieldKey: 'skills_required', label: 'Required skills', dataType: 'json', isRequired: false, section: 'Operations', displayOrder: 40 },
          { fieldKey: 'certification_required', label: 'Certification required', dataType: 'string', isRequired: false, section: 'Operations', displayOrder: 50 },
          { fieldKey: 'parts_typically_used', label: 'Parts typically needed', dataType: 'json', isRequired: false, section: 'Operations', displayOrder: 60 },
          { fieldKey: 'callout_fee', label: 'Callout fee (KES)', dataType: 'decimal', isRequired: false, section: 'Pricing', displayOrder: 70 },
          { fieldKey: 'travel_fee_per_km', label: 'Travel fee per km', dataType: 'decimal', isRequired: false, section: 'Pricing', displayOrder: 80 },
          { fieldKey: 'warranty_days', label: 'Service warranty (days)', dataType: 'number', isRequired: false, section: 'After-service', displayOrder: 90 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'primary_site_address', label: 'Primary service address', dataType: 'text', isRequired: true, section: 'Site', displayOrder: 10 },
          { fieldKey: 'site_gps_coords', label: 'GPS coords', dataType: 'string', isRequired: false, section: 'Site', displayOrder: 20 },
          { fieldKey: 'site_access_instructions', label: 'Access instructions', dataType: 'text', isRequired: false, section: 'Site', displayOrder: 30 },
          { fieldKey: 'preferred_technician', label: 'Preferred technician', dataType: 'reference', isRequired: false, section: 'Preferences', displayOrder: 40, config: { referenceEntity: 'user' } },
          { fieldKey: 'service_contract_id', label: 'Active service contract', dataType: 'string', isRequired: false, section: 'Contract', displayOrder: 50 },
          { fieldKey: 'contract_expires', label: 'Contract expiry', dataType: 'date', isRequired: false, section: 'Contract', displayOrder: 60 },
          { fieldKey: 'sla_response_hours', label: 'SLA response (hours)', dataType: 'number', isRequired: false, section: 'Contract', displayOrder: 70 },
        ],
      },
      {
        entity: 'asset',
        label: 'Client Assets',
        fields: [
          { fieldKey: 'client_id', label: 'Client', dataType: 'reference', isRequired: true, section: 'Ownership', displayOrder: 10, config: { referenceEntity: 'customer' } },
          { fieldKey: 'installation_date', label: 'Installation date', dataType: 'date', isRequired: false, section: 'Lifecycle', displayOrder: 20 },
          { fieldKey: 'last_service_date', label: 'Last service date', dataType: 'date', isRequired: false, section: 'Maintenance', displayOrder: 30 },
          { fieldKey: 'next_service_due', label: 'Next service due', dataType: 'date', isRequired: false, section: 'Maintenance', displayOrder: 40 },
          { fieldKey: 'service_contract_id', label: 'Contract covering this asset', dataType: 'string', isRequired: false, section: 'Contract', displayOrder: 50 },
          { fieldKey: 'model', label: 'Model', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 60 },
          { fieldKey: 'serial_number', label: 'Serial number', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 70 },
          { fieldKey: 'manufacturer', label: 'Manufacturer', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 80 },
        ],
      },
    ],
  },

  // ─── 8. Wholesale Distribution ─────────────────────────────────────────────
  {
    id: 'wholesale',
    name: 'Wholesale Distribution',
    description: 'High-volume B2B with volume pricing tiers, credit, and route logistics',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'case_pack_size', label: 'Case pack size', dataType: 'number', isRequired: true, section: 'Packaging', displayOrder: 10 },
          { fieldKey: 'cases_per_pallet', label: 'Cases per pallet', dataType: 'number', isRequired: false, section: 'Packaging', displayOrder: 20 },
          { fieldKey: 'pack_weight_kg', label: 'Case weight (kg)', dataType: 'decimal', isRequired: false, section: 'Packaging', displayOrder: 30 },
          { fieldKey: 'min_order_case_qty', label: 'Min order (cases)', dataType: 'number', isRequired: false, section: 'Sales', displayOrder: 40 },
          { fieldKey: 'moq_break_1_qty', label: 'MOQ break 1 (cases)', dataType: 'number', isRequired: false, section: 'Pricing', displayOrder: 50 },
          { fieldKey: 'moq_break_1_price', label: 'MOQ break 1 price', dataType: 'decimal', isRequired: false, section: 'Pricing', displayOrder: 60 },
          { fieldKey: 'moq_break_2_qty', label: 'MOQ break 2 (cases)', dataType: 'number', isRequired: false, section: 'Pricing', displayOrder: 70 },
          { fieldKey: 'moq_break_2_price', label: 'MOQ break 2 price', dataType: 'decimal', isRequired: false, section: 'Pricing', displayOrder: 80 },
          { fieldKey: 'moq_break_3_qty', label: 'MOQ break 3 (cases)', dataType: 'number', isRequired: false, section: 'Pricing', displayOrder: 90 },
          { fieldKey: 'moq_break_3_price', label: 'MOQ break 3 price', dataType: 'decimal', isRequired: false, section: 'Pricing', displayOrder: 100 },
          { fieldKey: 'is_fast_moving', label: 'Fast-moving SKU', dataType: 'boolean', isRequired: false, section: 'Classification', displayOrder: 110 },
          { fieldKey: 'abc_class', label: 'ABC classification', dataType: 'enum', isRequired: false, section: 'Classification', displayOrder: 120, config: { options: [{ value: 'A', label: 'A — High value' }, { value: 'B', label: 'B — Medium value' }, { value: 'C', label: 'C — Low value' }] } },
          { fieldKey: 'primary_manufacturer', label: 'Manufacturer', dataType: 'reference', isRequired: false, section: 'Sourcing', displayOrder: 130, config: { referenceEntity: 'vendor' } },
          { fieldKey: 'barcode_case', label: 'Case barcode', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 140 },
          { fieldKey: 'barcode_unit', label: 'Unit barcode', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 150 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'account_type', label: 'Account type', dataType: 'enum', isRequired: true, section: 'Classification', displayOrder: 10, config: { options: opts(['retailer', 'sub_distributor', 'end_user', 'export']) } },
          { fieldKey: 'credit_limit_kes', label: 'Credit limit (KES)', dataType: 'decimal', isRequired: true, section: 'Credit', displayOrder: 20 },
          { fieldKey: 'credit_terms_days', label: 'Credit terms (days)', dataType: 'number', isRequired: true, section: 'Credit', displayOrder: 30 },
          { fieldKey: 'credit_used_kes', label: 'Credit used (computed)', dataType: 'decimal', isRequired: false, section: 'Credit', displayOrder: 40 },
          { fieldKey: 'payment_rating', label: 'Payment rating', dataType: 'enum', isRequired: false, section: 'Credit', displayOrder: 50, config: { options: opts(['excellent', 'good', 'slow', 'poor']) } },
          { fieldKey: 'route_code', label: 'Delivery route', dataType: 'string', isRequired: false, section: 'Logistics', displayOrder: 60 },
          { fieldKey: 'delivery_days', label: 'Delivery days', dataType: 'json', isRequired: false, section: 'Logistics', displayOrder: 70 },
          { fieldKey: 'sales_rep', label: 'Assigned sales rep', dataType: 'reference', isRequired: false, section: 'Relationship', displayOrder: 80, config: { referenceEntity: 'user' } },
          { fieldKey: 'customer_since', label: 'Customer since', dataType: 'date', isRequired: false, section: 'Relationship', displayOrder: 90 },
          { fieldKey: 'annual_volume_forecast_kes', label: 'Annual volume forecast', dataType: 'decimal', isRequired: false, section: 'Commercial', displayOrder: 100 },
        ],
      },
    ],
  },

  // ─── 9. Auto Parts ──────────────────────────────────────────────────────────
  {
    id: 'auto_parts',
    name: 'Auto Parts',
    description: 'Vehicle compatibility, part interchange, supersession, and fitment',
    entities: [
      {
        entity: 'product',
        label: 'Parts',
        fields: [
          { fieldKey: 'part_number', label: 'Part number', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 10 },
          { fieldKey: 'oem_part_number', label: 'OEM part number', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 20 },
          { fieldKey: 'alternative_part_numbers', label: 'Alt part numbers', dataType: 'json', isRequired: false, section: 'Identification', displayOrder: 30 },
          { fieldKey: 'supersedes', label: 'Supersedes part numbers', dataType: 'json', isRequired: false, section: 'Identification', displayOrder: 40 },
          { fieldKey: 'superseded_by', label: 'Superseded by', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 50 },
          { fieldKey: 'manufacturer', label: 'Manufacturer', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 60 },
          { fieldKey: 'brand_tier', label: 'Brand tier', dataType: 'enum', isRequired: false, section: 'Pricing', displayOrder: 70, config: { options: opts(['oem', 'premium_aftermarket', 'economy_aftermarket', 'remanufactured']) } },
          { fieldKey: 'compatibility', label: 'Vehicle compatibility', dataType: 'json', isRequired: false, section: 'Compatibility', displayOrder: 80 },
          { fieldKey: 'category_auto', label: 'Category', dataType: 'enum', isRequired: true, section: 'Classification', displayOrder: 90, config: { options: opts(['engine', 'transmission', 'electrical', 'suspension', 'brakes', 'body', 'interior', 'consumables', 'oils']) } },
          { fieldKey: 'is_consumable', label: 'Consumable', dataType: 'boolean', isRequired: false, section: 'Classification', displayOrder: 100 },
          { fieldKey: 'fitment_side', label: 'Fitment side', dataType: 'enum', isRequired: false, section: 'Fitment', displayOrder: 110, config: { options: opts(['left', 'right', 'front', 'rear', 'front_left', 'front_right', 'rear_left', 'rear_right', 'any']) } },
          { fieldKey: 'is_genuine', label: 'Genuine OEM', dataType: 'boolean', isRequired: false, section: 'Classification', displayOrder: 120 },
          { fieldKey: 'warranty_months', label: 'Warranty (months)', dataType: 'number', isRequired: false, section: 'After-sales', displayOrder: 130 },
          { fieldKey: 'core_charge', label: 'Core charge (KES)', dataType: 'decimal', isRequired: false, section: 'Pricing', displayOrder: 140 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'customer_type', label: 'Customer type', dataType: 'enum', isRequired: true, section: 'Classification', displayOrder: 10, config: { options: opts(['workshop', 'individual', 'fleet', 'reseller']) } },
          { fieldKey: 'workshop_license', label: 'Workshop license', dataType: 'string', isRequired: false, section: 'Classification', displayOrder: 20 },
          { fieldKey: 'fleet_vehicles', label: 'Fleet vehicles', dataType: 'json', isRequired: false, section: 'Fleet', displayOrder: 30 },
          { fieldKey: 'primary_vehicle_makes', label: 'Primary vehicle makes serviced', dataType: 'json', isRequired: false, section: 'Classification', displayOrder: 40 },
        ],
      },
    ],
  },

  // ─── 10. Beauty / Cosmetics ─────────────────────────────────────────────────
  {
    id: 'beauty',
    name: 'Beauty / Cosmetics',
    description: 'Batch tracking, PAO, ethical flags, and skin/hair type targeting',
    entities: [
      {
        entity: 'product',
        label: 'Products',
        fields: [
          { fieldKey: 'brand', label: 'Brand', dataType: 'string', isRequired: true, section: 'Identification', displayOrder: 10 },
          { fieldKey: 'product_line', label: 'Product line', dataType: 'string', isRequired: false, section: 'Identification', displayOrder: 20 },
          { fieldKey: 'category_beauty', label: 'Category', dataType: 'enum', isRequired: true, section: 'Classification', displayOrder: 30, config: { options: opts(['skincare', 'makeup', 'haircare', 'bodycare', 'fragrance', 'tools']) } },
          { fieldKey: 'sub_category', label: 'Sub-category', dataType: 'string', isRequired: false, section: 'Classification', displayOrder: 40 },
          { fieldKey: 'skin_type', label: 'Skin type', dataType: 'json', isRequired: false, section: 'Targeting', displayOrder: 50 },
          { fieldKey: 'hair_type', label: 'Hair type', dataType: 'json', isRequired: false, section: 'Targeting', displayOrder: 60 },
          { fieldKey: 'color_shade', label: 'Color / shade', dataType: 'string', isRequired: false, section: 'Variant', displayOrder: 70 },
          { fieldKey: 'shade_code', label: 'Shade code', dataType: 'string', isRequired: false, section: 'Variant', displayOrder: 80 },
          { fieldKey: 'volume_ml', label: 'Volume (ml)', dataType: 'decimal', isRequired: false, section: 'Packaging', displayOrder: 90 },
          { fieldKey: 'weight_grams', label: 'Weight (grams)', dataType: 'decimal', isRequired: false, section: 'Packaging', displayOrder: 100 },
          { fieldKey: 'batch_required', label: 'Batch tracking', dataType: 'boolean', isRequired: true, section: 'Regulatory', displayOrder: 110 },
          { fieldKey: 'pao_months', label: 'PAO (Period After Opening)', dataType: 'number', isRequired: false, section: 'Regulatory', displayOrder: 120 },
          { fieldKey: 'shelf_life_months', label: 'Shelf life (months)', dataType: 'number', isRequired: false, section: 'Regulatory', displayOrder: 130 },
          { fieldKey: 'ingredients', label: 'Ingredients', dataType: 'text', isRequired: false, section: 'Composition', displayOrder: 140 },
          { fieldKey: 'is_vegan', label: 'Vegan', dataType: 'boolean', isRequired: false, section: 'Ethics', displayOrder: 150 },
          { fieldKey: 'is_cruelty_free', label: 'Cruelty-free', dataType: 'boolean', isRequired: false, section: 'Ethics', displayOrder: 160 },
          { fieldKey: 'is_halal', label: 'Halal-certified', dataType: 'boolean', isRequired: false, section: 'Ethics', displayOrder: 170 },
          { fieldKey: 'is_pregnancy_safe', label: 'Pregnancy-safe', dataType: 'boolean', isRequired: false, section: 'Safety', displayOrder: 180 },
          { fieldKey: 'kebs_approval_no', label: 'KEBS approval number', dataType: 'string', isRequired: false, section: 'Regulatory', displayOrder: 190 },
        ],
      },
      {
        entity: 'customer',
        label: 'Customers',
        fields: [
          { fieldKey: 'skin_type', label: 'Skin type', dataType: 'enum', isRequired: false, section: 'Profile', displayOrder: 10, config: { options: opts(['oily', 'dry', 'combination', 'sensitive', 'normal', 'mature']) } },
          { fieldKey: 'hair_type', label: 'Hair type', dataType: 'enum', isRequired: false, section: 'Profile', displayOrder: 20, config: { options: opts(['oily', 'dry', 'colored', 'natural', 'fine', 'thick', 'curly']) } },
          { fieldKey: 'skin_concerns', label: 'Skin concerns', dataType: 'json', isRequired: false, section: 'Profile', displayOrder: 30 },
          { fieldKey: 'sensitivities', label: 'Known sensitivities', dataType: 'text', isRequired: false, section: 'Medical', displayOrder: 40 },
          { fieldKey: 'preferred_brands', label: 'Preferred brands', dataType: 'json', isRequired: false, section: 'Preferences', displayOrder: 50 },
          { fieldKey: 'beauty_advisor', label: 'Assigned beauty advisor', dataType: 'reference', isRequired: false, section: 'Relationship', displayOrder: 60, config: { referenceEntity: 'user' } },
          { fieldKey: 'loyalty_tier', label: 'Loyalty tier', dataType: 'enum', isRequired: false, section: 'Loyalty', displayOrder: 70, config: { options: opts(['standard', 'silver', 'gold', 'platinum']) } },
        ],
      },
    ],
  },
];

export function useFieldTemplates() {
  const verticals = computed(() => VERTICALS);

  function totalFields(vertical: VerticalTemplate): number {
    return vertical.entities.reduce((sum, e) => sum + e.fields.length, 0);
  }

  return { verticals, totalFields };
}
