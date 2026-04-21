import { Router } from 'express';
import { LoginRequest, RefreshRequest, RegisterTenantRequest } from '@inventory/contracts/auth';
import { authService } from './auth.service.js';

export const authRouter: Router = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = LoginRequest.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = RegisterTenantRequest.parse(req.body);
    const result = await authService.registerTenant(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = RefreshRequest.parse(req.body);
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
