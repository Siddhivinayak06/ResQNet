// ─────────────────────────────────────────────────────────────
// ResQNet — RBAC (Role-Based Access Control) Middleware
// Fine-grained role + permission checks. Supports both
// role-based and permission-based authorization.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import type { UserRole, AuthenticatedRequest } from '../types/index.js';

/**
 * Permission matrix defining what each role can do.
 * Roles inherit permissions from lower roles in the hierarchy.
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  citizen: [
    'incident:create',
    'incident:read:own',
    'profile:read:own',
    'profile:update:own',
    'chat:send',
    'notification:read:own',
  ],
  volunteer: [
    'incident:create',
    'incident:read:own',
    'incident:read:assigned',
    'incident:update:assigned',
    'profile:read:own',
    'profile:update:own',
    'chat:send',
    'notification:read:own',
    'volunteer:read:own',
    'volunteer:update:own',
  ],
  responder: [
    'incident:create',
    'incident:read',
    'incident:update',
    'incident:assign',
    'profile:read:own',
    'profile:update:own',
    'chat:send',
    'notification:read:own',
    'vehicle:read',
    'vehicle:update:assigned',
    'hospital:read',
    'resource:read',
    'evidence:upload',
  ],
  hospital_admin: [
    'hospital:read:own',
    'hospital:update:own',
    'hospital:manage:beds',
    'hospital:manage:doctors',
    'hospital:manage:blood',
    'hospital:manage:queue',
    'incident:read',
    'vehicle:read',
    'profile:read:own',
    'profile:update:own',
  ],
  police_admin: [
    'incident:read',
    'incident:update',
    'incident:assign',
    'vehicle:read',
    'vehicle:update',
    'profile:read:own',
    'profile:update:own',
    'evidence:read',
    'evidence:upload',
    'crime:manage',
  ],
  fire_admin: [
    'incident:read',
    'incident:update',
    'incident:assign',
    'vehicle:read',
    'vehicle:update',
    'profile:read:own',
    'profile:update:own',
    'resource:read',
    'resource:update',
  ],
  admin: [
    'incident:read',
    'incident:update',
    'incident:delete',
    'incident:assign',
    'user:read',
    'user:update',
    'user:delete',
    'hospital:read',
    'hospital:update',
    'vehicle:read',
    'vehicle:update',
    'volunteer:read',
    'volunteer:update',
    'resource:read',
    'resource:update',
    'disaster:read',
    'disaster:update',
    'audit:read',
    'notification:send',
    'analytics:read',
    'admin:dashboard',
    'system:health',
    'broadcast:send',
  ],
  super_admin: ['*'], // Wildcard — all permissions
};

/**
 * Role-based authorization middleware.
 * Must be used AFTER the `protect` middleware.
 * @param roles - Roles allowed to access this route
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'RBAC_NOT_AUTHENTICATED',
      });
      return;
    }

    if (!roles.includes(user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Role '${user.role}' is not authorized for this resource.`,
        code: 'RBAC_INSUFFICIENT_ROLE',
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based authorization middleware.
 * Must be used AFTER the `protect` middleware.
 * @param requiredPermission - The permission string required (e.g., 'incident:update')
 */
export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'RBAC_NOT_AUTHENTICATED',
      });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];

    // Super admin has wildcard access
    if (userPermissions.includes('*')) {
      return next();
    }

    if (!userPermissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        error: `Permission '${requiredPermission}' required. Your role '${user.role}' does not have this permission.`,
        code: 'RBAC_INSUFFICIENT_PERMISSION',
      });
      return;
    }

    next();
  };
}

/**
 * Get all permissions for a given role.
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}
