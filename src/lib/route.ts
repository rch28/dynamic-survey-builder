/**
 * @description Public routes
 * An array of routes that are public and do not require authentication
 *
 * @type {string[]}
 */
export const publicRoutes = ["/", "/about"];

/**
 * @description Routes to authenticate
 * An array of routes that are used for the authentication process
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify",
  "/verify/callback",
  "/auth/confirm",
];

/**
 * @description Prefix for all admin routes
 * Routes that start with this prefix are used for admin dashboard
 * @type {string}
 */
export const adminPrefix = "/admin";

/**
 * @description Prefix for all auth routes
 * Routes that start with this prefix are  used for API authentication process
 * @type {string}
 */

export const apiAuthPrefix = "/api/auth";

/**
 * @description Default login redirect
 * The default route to redirect to after a successful login
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/";
