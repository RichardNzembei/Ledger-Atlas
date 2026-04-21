<template>
  <div class="h-full flex flex-col md:flex-row overflow-hidden">
    <!-- Left: cart summary -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-950">
      <h2 class="font-bold text-lg mb-2">Order Summary</h2>
      <div
        v-for="item in cart.items"
        :key="item.productId"
        class="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-800"
      >
        <span class="font-medium">{{ item.name }}</span>
        <span class="text-gray-500 mx-4">x{{ item.quantity }}</span>
        <span class="font-semibold">{{ fmt(item.quantity * item.unitPrice) }}</span>
      </div>

      <div class="pt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div class="flex justify-between">
          <span>Subtotal</span><span>{{ fmt(cart.subtotal) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Tax (16%)</span><span>{{ fmt(cart.taxTotal) }}</span>
        </div>
        <div class="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-1">
          <span>Total</span><span>{{ fmt(cart.total) }}</span>
        </div>
      </div>
    </div>

    <!-- Right: payment panel -->
    <div class="w-full md:w-96 bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 flex flex-col p-4 gap-4">
      <h2 class="font-bold text-lg">Payment</h2>

      <!-- Location selector (required) -->
      <UFormGroup label="Location" required>
        <USelect
          v-model="locationId"
          :options="locationOptions"
          value-attribute="value"
          option-attribute="label"
          placeholder="Select location..."
        />
      </UFormGroup>

      <!-- Payment lines -->
      <div class="space-y-3">
        <div
          v-for="(pmt, idx) in paymentLines"
          :key="idx"
          class="flex gap-2 items-end"
        >
          <UFormGroup label="Method" class="flex-1">
            <USelect
              v-model="pmt.method"
              :options="paymentMethods"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>
          <UFormGroup label="Amount" class="flex-1">
            <UInput v-model.number="pmt.amount" type="number" min="0" step="0.01" />
          </UFormGroup>
          <UFormGroup label="Ref" class="flex-1">
            <UInput v-model="pmt.reference" placeholder="optional" />
          </UFormGroup>
          <UButton
            v-if="paymentLines.length > 1"
            icon="i-heroicons-trash"
            variant="ghost"
            color="red"
            size="xs"
            class="mb-1"
            @click="paymentLines.splice(idx, 1)"
          />
        </div>
        <UButton size="xs" variant="outline" @click="addPaymentLine">+ Split payment</UButton>
      </div>

      <!-- Tendered / change summary -->
      <div class="text-sm space-y-1 text-gray-600 dark:text-gray-400">
        <div class="flex justify-between">
          <span>Tendered</span><span>{{ fmt(totalTendered) }}</span>
        </div>
        <div class="flex justify-between font-semibold" :class="change < 0 ? 'text-red-500' : 'text-green-600'">
          <span>{{ change < 0 ? 'Short' : 'Change' }}</span>
          <span>{{ fmt(Math.abs(change)) }}</span>
        </div>
      </div>

      <UAlert v-if="error" color="red" :description="error" />

      <div class="mt-auto space-y-2">
        <UButton
          block
          size="lg"
          color="green"
          :loading="loading"
          :disabled="!canCharge"
          @click="charge"
        >
          Confirm Payment
        </UButton>
        <UButton block variant="ghost" to="/pos">Back to Cart</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'pos' });

const { api } = useApi();
const cart = usePosCartStore();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const locationId = ref(cart.locationId ?? '');

interface PaymentLine {
  method: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit' | 'other';
  amount: number;
  reference: string;
}

const paymentLines = ref<PaymentLine[]>([
  { method: 'cash', amount: cart.total, reference: '' },
]);

const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'M-Pesa', value: 'mpesa' },
  { label: 'Card', value: 'card' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Credit', value: 'credit' },
  { label: 'Other', value: 'other' },
];

const { data: locationsData } = await useAsyncData('checkout-locations', () =>
  api<{ items: Array<{ id: string; name: string }> }>('/api/v1/locations', {
    query: { limit: 100 },
  }),
);

const locationOptions = computed(
  () => locationsData.value?.items.map((l) => ({ label: l.name, value: l.id })) ?? [],
);

const totalTendered = computed(() =>
  paymentLines.value.reduce((s, p) => s + (p.amount || 0), 0),
);

const change = computed(() => totalTendered.value - cart.total);

const canCharge = computed(
  () => locationId.value && cart.itemCount > 0 && totalTendered.value >= cart.total,
);

function addPaymentLine() {
  paymentLines.value.push({ method: 'cash', amount: 0, reference: '' });
}

function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}

async function charge() {
  if (!canCharge.value) return;
  loading.value = true;
  error.value = '';

  try {
    // 1. Create the sale
    const sale = await api<{ id: string }>('/api/v1/sales', {
      method: 'POST',
      body: {
        locationId: locationId.value,
        customerId: cart.customerId ?? undefined,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPct: i.discountPct,
        })),
      },
    });

    // 2. Complete with payments
    await api('/api/v1/sales/complete', {
      method: 'POST',
      body: {
        saleId: sale.id,
        payments: paymentLines.value
          .filter((p) => p.amount > 0)
          .map((p) => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference || undefined,
          })),
      },
    });

    cart.clear();
    await router.push(`/pos/receipt/${sale.id}`);
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Payment failed';
  } finally {
    loading.value = false;
  }
}
</script>
