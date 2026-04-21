import { config } from '../../config/index.js';
import { logger } from '../../infra/logger.js';

interface MpesaToken {
  accessToken: string;
  expiresAt: number;
}

interface StkPushInput {
  amount: number;
  phone: string;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

class MpesaClient {
  private cached: MpesaToken | null = null;

  private get baseUrl(): string {
    return config.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    if (this.cached && Date.now() < this.cached.expiresAt) {
      return this.cached.accessToken;
    }

    const creds = Buffer.from(
      `${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`,
    ).toString('base64');

    const res = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${creds}` } },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`M-Pesa token error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.cached = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return this.cached.accessToken;
  }

  async stkPush(input: StkPushInput) {
    const token = await this.getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);

    const password = Buffer.from(
      `${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`,
    ).toString('base64');

    const body = {
      BusinessShortCode: config.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(input.amount),
      PartyA: input.phone,
      PartyB: config.MPESA_SHORTCODE,
      PhoneNumber: input.phone,
      CallBackURL: input.callbackUrl,
      AccountReference: input.accountReference,
      TransactionDesc: input.transactionDesc,
    };

    const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as Record<string, unknown>;
    logger.info({ data, phone: input.phone, amount: input.amount }, 'M-Pesa STK push initiated');
    return data;
  }
}

export const mpesa = new MpesaClient();
