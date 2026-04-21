import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { and, eq } from 'drizzle-orm';
import { tenants, users } from '@inventory/db/schema';
import { LoginRequest, RegisterTenantRequest } from '@inventory/contracts/auth';
import { DomainError, NotFoundError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { config } from '../../config/index.js';
import { db } from '../../infra/db.js';
import { logger } from '../../infra/logger.js';
import { eventBus } from '../../infra/eventBus.js';
import { EventTypes } from '@inventory/events';

export class AuthService {
  async login(body: LoginRequest) {
    const tenantRow = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, body.tenantSlug))
      .limit(1);

    if (!tenantRow[0]) {
      throw new DomainError('invalid_credentials', 'Invalid credentials', 401);
    }

    const tenant = tenantRow[0];
    const tenantId = tenant.id as Buffer;

    const userRows = await db
      .select()
      .from(users)
      .where(
        and(eq(users.tenantId, tenantId), eq(users.email, body.email.toLowerCase())),
      )
      .limit(1);

    const user = userRows[0];
    if (!user) {
      throw new DomainError('invalid_credentials', 'Invalid credentials', 401);
    }

    if (user.status !== 'active') {
      throw new DomainError('account_inactive', 'Account is not active', 403);
    }

    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) {
      throw new DomainError('invalid_credentials', 'Invalid credentials', 401);
    }

    const userId = binaryToUuid(user.id as Buffer);
    const tenantIdStr = binaryToUuid(tenantId);

    const token = jwt.sign(
      {
        sub: userId,
        tid: tenantIdStr,
        roles: (user.roles as string[]) ?? [],
        email: user.email,
        name: user.displayName,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    const refreshToken = jwt.sign(
      { sub: userId, tid: tenantIdStr, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions,
    );

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id as Buffer));

    eventBus.publish({
      type: EventTypes.USER_LOGGED_IN,
      tenantId,
      payload: { userId, email: user.email },
      metadata: {},
      occurredAt: new Date(),
    });

    logger.info({ userId, tenantId: tenantIdStr }, 'user logged in');

    return {
      token,
      refreshToken,
      expiresIn: 86400,
      user: {
        id: userId,
        email: user.email,
        displayName: user.displayName,
        tenantId: tenantIdStr,
        tenantSlug: body.tenantSlug,
        roles: (user.roles as string[]) ?? [],
      },
    };
  }

  async registerTenant(body: RegisterTenantRequest) {
    const existing = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, body.tenantSlug))
      .limit(1);

    if (existing[0]) {
      throw new DomainError('slug_taken', 'This tenant slug is already in use', 409);
    }

    const tenantId = uuidToBinary(uuidv7());
    const userId = uuidToBinary(uuidv7());
    const passwordHash = await argon2.hash(body.adminPassword, { type: argon2.argon2id });

    await db.transaction(async (tx) => {
      await tx.insert(tenants).values({
        id: tenantId,
        slug: body.tenantSlug,
        name: body.tenantName,
        status: 'trial',
        plan: 'free',
        settings: {},
      });

      await tx.insert(users).values({
        id: userId,
        tenantId,
        email: body.adminEmail.toLowerCase(),
        passwordHash,
        displayName: body.adminName,
        status: 'active',
        roles: ['admin'],
      });
    });

    logger.info(
      { tenantId: binaryToUuid(tenantId), email: body.adminEmail },
      'new tenant registered',
    );

    return { tenantId: binaryToUuid(tenantId), tenantSlug: body.tenantSlug };
  }

  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as {
        sub: string;
        tid: string;
        type: string;
      };

      if (payload.type !== 'refresh') {
        throw new DomainError('invalid_token', 'Not a refresh token', 401);
      }

      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, uuidToBinary(payload.sub)))
        .limit(1);

      const user = userRows[0];
      if (!user || user.status !== 'active') {
        throw new DomainError('invalid_token', 'User not found or inactive', 401);
      }

      const newToken = jwt.sign(
        {
          sub: payload.sub,
          tid: payload.tid,
          roles: (user.roles as string[]) ?? [],
          email: user.email,
          name: user.displayName,
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      return { token: newToken, expiresIn: 86400 };
    } catch (err) {
      if (err instanceof DomainError) throw err;
      throw new DomainError('invalid_token', 'Refresh token is invalid or expired', 401);
    }
  }
}

export const authService = new AuthService();
