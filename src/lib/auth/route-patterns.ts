/**
 * Route pattern matching utilities for authentication middleware
 * 
 * This module provides centralized route pattern definitions and matching logic
 * for the authentication middleware. It keeps the middleware clean and makes
 * route patterns easily maintainable.
 */

/**
 * Public pages that don't require authentication
 */
export const PUBLIC_PAGES = [
  '/',
  '/login',
  '/register',
  '/prompts',
  '/discover',
  '/categories',
  '/tags',
  '/about',
  '/privacy',
  '/terms',
  '/docs',
  '/book',
  '/kids',
  '/embed',
  '/brand',
  '/developers',
  '/support',
  '/workflows',
  '/skills',
  '/promptmasters',
  '/how_to_write_effective_prompts',
];

/**
 * Public API routes that don't require authentication
 * These are primarily read-only endpoints
 */
export const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/auth/register',
  '/api/auth/providers',
  '/api/auth/session',
  '/api/auth/signin',
  '/api/auth/signin/**',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/callback/**',
  '/api/auth/csrf',
  '/api/auth/error',
  '/api/book/demo',
  '/api/leaderboard',
  '/api/config/storage',
  '/prompts.json',
  '/prompts.csv',
  '/.well-known/skills',
];

/**
 * API routes that are public for GET requests only
 * Write operations (POST/PUT/PATCH/DELETE) require authentication
 */
export const PUBLIC_READ_ONLY_API_ROUTES = [
  '/api/prompts',
  '/api/prompts/search',
  '/api/search/ai',
];

/**
 * Pages that require authentication
 */
export const PROTECTED_PAGES = [
  '/settings',
  '/feed',
  '/collection',
  '/prompts/new',
  '/builder',
];

/**
 * API routes that require authentication
 */
export const PROTECTED_API_ROUTES = [
  '/api/user',
  '/api/collection',
  '/api/upload',
  '/api/improve-prompt',
  '/api/generate',
  '/api/prompt-builder',
  '/api/media-generate',
];

/**
 * Pages that require admin role
 */
export const ADMIN_PAGES = [
  '/admin',
];

/**
 * API routes that require admin role
 */
export const ADMIN_API_ROUTES = [
  '/api/admin',
];

/**
 * Match a pathname against a list of patterns
 * Supports dynamic segments like [id] and wildcards
 * 
 * @param pathname - The pathname to match
 * @param patterns - Array of pattern strings
 * @returns true if pathname matches any pattern
 */
export function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert pattern to regex
    // [id] -> [^/]+ (any characters except slash)
    // ** -> .* (zero or more of any character) - must be replaced first
    // * -> [^/]* (zero or more characters except slash)
    const regexPattern = pattern
      .replace(/\[[\w]+\]/g, '[^/]+')  // Dynamic segments
      .replace(/\*\*/g, '___DOUBLE_WILDCARD___')  // Placeholder for **
      .replace(/\*/g, '[^/]*')          // Wildcard (single segment)
      .replace(/___DOUBLE_WILDCARD___/g, '.*');   // Replace ** with .*
    
    const regex = new RegExp(`^${regexPattern}/?$`);
    return regex.test(pathname);
  });
}

/**
 * Check if a pathname starts with any of the given prefixes
 * More efficient than pattern matching for simple prefix checks
 * 
 * @param pathname - The pathname to check
 * @param prefixes - Array of prefix strings
 * @returns true if pathname starts with any prefix
 */
export function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Check if a route is a public read-only API that allows GET requests
 * 
 * @param pathname - The pathname to check
 * @param method - HTTP method
 * @returns true if this is a public read-only API with GET method
 */
export function isPublicReadOnlyAPI(pathname: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }
  
  // Check exact matches and pattern matches
  return matchesPattern(pathname, PUBLIC_READ_ONLY_API_ROUTES);
}

/**
 * Determine the protection level required for a route
 * 
 * @param pathname - The pathname to check
 * @param method - HTTP method
 * @returns 'public' | 'auth' | 'admin'
 */
export function getRouteProtection(pathname: string, method: string): 'public' | 'auth' | 'admin' {
  // Check admin routes first (most specific)
  if (startsWithAny(pathname, ADMIN_PAGES) || startsWithAny(pathname, ADMIN_API_ROUTES)) {
    return 'admin';
  }
  
  // Check protected routes
  if (startsWithAny(pathname, PROTECTED_PAGES) || startsWithAny(pathname, PROTECTED_API_ROUTES)) {
    return 'auth';
  }
  
  // Check if it's a protected dynamic route (e.g., /prompts/[id]/edit)
  if (pathname.includes('/edit') || pathname.includes('/changes/new')) {
    return 'auth';
  }
  
  // Check public routes
  if (matchesPattern(pathname, PUBLIC_PAGES) || matchesPattern(pathname, PUBLIC_API_ROUTES)) {
    return 'public';
  }
  
  // Check public read-only APIs
  if (isPublicReadOnlyAPI(pathname, method)) {
    return 'public';
  }
  
  // Special handling for dynamic prompt routes
  // GET /api/prompts/[id] is public, but other methods require auth
  if (pathname.match(/^\/api\/prompts\/[^/]+$/)) {
    return method === 'GET' ? 'public' : 'auth';
  }
  
  // GET requests to prompt sub-resources are public
  // (e.g., /api/prompts/[id]/raw, /api/prompts/[id]/comments)
  if (pathname.match(/^\/api\/prompts\/[^/]+\/.+$/) && method === 'GET') {
    return 'public';
  }
  
  // View prompt pages are public (e.g., /prompts/[id])
  if (pathname.match(/^\/prompts\/[^/]+$/) && !pathname.includes('/edit')) {
    return 'public';
  }
  
  // Category and tag detail pages are public
  if (pathname.match(/^\/(categories|tags)\/[^/]+$/)) {
    return 'public';
  }
  
  // User profile pages are public (e.g., /[username])
  // These are at the root level and don't start with known prefixes
  // Only treat as user profile if it looks like a valid username pattern
  if (pathname.match(/^\/[a-zA-Z0-9_-]+$/) && !pathname.startsWith('/_')) {
    // Check if it's not a known system route
    const knownSystemRoutes = ['settings', 'feed', 'collection', 'admin', 'builder', 'prompts', 'discover', 'categories', 'tags', 'about', 'privacy', 'terms', 'docs', 'book', 'kids', 'embed', 'brand', 'developers', 'support', 'workflows', 'skills', 'promptmasters'];
    const routeName = pathname.slice(1); // Remove leading slash
    
    if (!knownSystemRoutes.includes(routeName)) {
      return 'public'; // Likely a user profile
    }
  }
  
  // Default to requiring authentication for unknown routes
  // This is a fail-safe approach - better to require auth than expose data
  return 'auth';
}

/**
 * Check if a pathname should be excluded from middleware processing
 * (static files, Next.js internals, etc.)
 * 
 * @param pathname - The pathname to check
 * @returns true if middleware should skip this path
 */
export function shouldSkipMiddleware(pathname: string): boolean {
  // Skip Next.js internals
  if (pathname.startsWith('/_next')) {
    return true;
  }
  
  // Skip favicon
  if (pathname.startsWith('/favicon')) {
    return true;
  }
  
  // Skip Sentry monitoring endpoint
  if (pathname.startsWith('/monitoring')) {
    return true;
  }
  
  // Skip static files (images, fonts, etc.)
  // But don't skip API routes that might have dots in them
  if (pathname.includes('.') && !pathname.startsWith('/api/')) {
    return true;
  }
  
  return false;
}
