/**
 * Authentication Middleware
 * 
 * This middleware provides comprehensive authentication protection for pages and APIs
 * while maintaining upstream compatibility. It acts as an additional security layer
 * on top of existing inline authentication checks.
 * 
 * Key Features:
 * - Protects pages and API routes based on configurable patterns
 * - Distinguishes between public, authenticated, and admin-only routes
 * - Supports HTTP method-aware protection (GET vs POST/PUT/DELETE)
 * - Provides consistent error responses for APIs
 * - Can be disabled via environment variable for upstream compatibility
 * 
 * Design Principles:
 * - Non-invasive: Zero modifications to existing code
 * - Fail-safe: Existing auth checks remain functional
 * - Easy removal: Single file deletion removes all changes
 * - Performance: Runs at edge with minimal overhead
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getRouteProtection,
  shouldSkipMiddleware,
} from '@/lib/auth/route-patterns';

// Feature flag - can be disabled if conflicts arise with upstream changes
const ENHANCED_PROTECTION_ENABLED = process.env.ENHANCED_AUTH_PROTECTION !== 'false';

// Debug mode for development
const DEBUG_MIDDLEWARE = process.env.DEBUG_MIDDLEWARE === 'true';

/**
 * Log debug information if debug mode is enabled
 */
function debugLog(message: string, data?: unknown) {
  if (DEBUG_MIDDLEWARE) {
    console.log(`[Middleware] ${message}`, data || '');
  }
}

/**
 * Main middleware function
 * Intercepts requests and applies authentication rules
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  debugLog('Processing request', { pathname, method });
  
  // If enhanced protection is disabled, allow all requests
  if (!ENHANCED_PROTECTION_ENABLED) {
    debugLog('Enhanced protection disabled, allowing request');
    return NextResponse.next();
  }
  
  // Skip middleware for static files and Next.js internals
  if (shouldSkipMiddleware(pathname)) {
    debugLog('Skipping middleware for static/internal path');
    return NextResponse.next();
  }
  
  // Determine protection level required for this route
  const protectionLevel = getRouteProtection(pathname, method);
  debugLog('Protection level determined', { protectionLevel });
  
  // Public routes - allow without authentication
  if (protectionLevel === 'public') {
    debugLog('Public route, allowing request');
    return NextResponse.next();
  }
  
  // Get user session
  const session = await auth();
  debugLog('Session check', { authenticated: !!session?.user });
  
  // Handle unauthenticated users
  if (!session?.user) {
    debugLog('User not authenticated, blocking request');
    
    // API routes return JSON error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }
    
    // Pages redirect to login with callback URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    debugLog('Redirecting to login', { loginUrl: loginUrl.toString() });
    return NextResponse.redirect(loginUrl);
  }
  
  // Handle admin-only routes
  if (protectionLevel === 'admin') {
    debugLog('Admin route, checking role', { role: session.user.role });
    
    if (session.user.role !== 'ADMIN') {
      debugLog('User is not admin, blocking request');
      
      // API routes return JSON error
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'forbidden',
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED',
          },
          { status: 403 }
        );
      }
      
      // Pages redirect to home
      debugLog('Redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // User is authenticated and authorized
  debugLog('Request authorized, allowing');
  return NextResponse.next();
}

/**
 * Middleware configuration
 * Defines which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - monitoring (Sentry tunnel)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$).*)',
  ],
};
