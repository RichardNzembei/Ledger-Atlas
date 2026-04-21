import { randomBytes } from 'node:crypto';

/**
 * UUID v7: time-ordered, sortable, suitable as a primary key.
 * Layout: 48-bit ms timestamp | 4-bit version=7 | 12-bit random | 2-bit variant | 62-bit random
 */
export function uuidv7(): string {
  const ts = BigInt(Date.now());
  const rand = randomBytes(10);

  const hi = (ts >> 16n) & 0xffffffffffffn;
  const mid = (ts & 0xffffn) | 0x7000n;
  const lo =
    ((BigInt(rand[0]!) & 0x3fn) | 0x80n) << 56n |
    BigInt(rand[1]!) << 48n |
    BigInt(rand[2]!) << 40n |
    BigInt(rand[3]!) << 32n |
    BigInt(rand[4]!) << 24n |
    BigInt(rand[5]!) << 16n |
    BigInt(rand[6]!) << 8n |
    BigInt(rand[7]!);

  const hex = hi.toString(16).padStart(12, '0') +
    mid.toString(16).padStart(4, '0') +
    lo.toString(16).padStart(16, '0');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidToBinary(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

export function binaryToUuid(buf: Buffer): string {
  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
