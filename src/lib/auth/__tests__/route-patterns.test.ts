/**
 * Tests for route pattern matching utilities
 */

import { describe, it, expect } from 'vitest';
import {
  matchesPattern,
  startsWithAny,
  isPublicReadOnlyAPI,
  getRouteProtection,
  shouldSkipMiddleware,
} from '../route-patterns';

describe('matchesPattern', () => {
  it('should match exact paths', () => {
    expect(matchesPattern('/login', ['/login', '/register'])).toBe(true);
    expect(matchesPattern('/register', ['/login', '/register'])).toBe(true);
    expect(matchesPattern('/settings', ['/login', '/register'])).toBe(false);
  });

  it('should match dynamic segments', () => {
    const patterns = ['/prompts/[id]', '/users/[username]'];
    
    expect(matchesPattern('/prompts/123', patterns)).toBe(true);
    expect(matchesPattern('/prompts/abc-def', patterns)).toBe(true);
    expect(matchesPattern('/users/john', patterns)).toBe(true);
    expect(matchesPattern('/prompts/123/edit', patterns)).toBe(false);
  });

  it('should match wildcards', () => {
    const patterns = ['/admin/*', '/api/admin/**'];
    
    expect(matchesPattern('/admin/users', patterns)).toBe(true);
    expect(matchesPattern('/admin/settings', patterns)).toBe(true);
    expect(matchesPattern('/api/admin/users/123', patterns)).toBe(true);
    expect(matchesPattern('/api/admin/deep/nested/path', patterns)).toBe(true);
  });

  it('should handle trailing slashes', () => {
    const patterns = ['/login', '/register'];
    
    expect(matchesPattern('/login/', patterns)).toBe(true);
    expect(matchesPattern('/login', patterns)).toBe(true);
  });
});

describe('startsWithAny', () => {
  it('should check if path starts with any prefix', () => {
    const prefixes = ['/admin', '/api/admin'];
    
    expect(startsWithAny('/admin/users', prefixes)).toBe(true);
    expect(startsWithAny('/api/admin/users', prefixes)).toBe(true);
    expect(startsWithAny('/settings', prefixes)).toBe(false);
  });

  it('should be case-sensitive', () => {
    const prefixes = ['/admin'];
    
    expect(startsWithAny('/admin', prefixes)).toBe(true);
    expect(startsWithAny('/Admin', prefixes)).toBe(false);
  });
});

describe('isPublicReadOnlyAPI', () => {
  it('should allow GET requests to public read-only APIs', () => {
    expect(isPublicReadOnlyAPI('/api/prompts', 'GET')).toBe(true);
    expect(isPublicReadOnlyAPI('/api/prompts/search', 'GET')).toBe(true);
    expect(isPublicReadOnlyAPI('/api/search/ai', 'GET')).toBe(true);
  });

  it('should deny non-GET requests to public read-only APIs', () => {
    expect(isPublicReadOnlyAPI('/api/prompts', 'POST')).toBe(false);
    expect(isPublicReadOnlyAPI('/api/prompts', 'PUT')).toBe(false);
    expect(isPublicReadOnlyAPI('/api/prompts', 'DELETE')).toBe(false);
    expect(isPublicReadOnlyAPI('/api/prompts', 'PATCH')).toBe(false);
  });

  it('should deny GET requests to non-public APIs', () => {
    expect(isPublicReadOnlyAPI('/api/user/profile', 'GET')).toBe(false);
    expect(isPublicReadOnlyAPI('/api/admin/users', 'GET')).toBe(false);
  });
});

describe('getRouteProtection', () => {
  describe('public routes', () => {
    it('should identify public pages', () => {
      expect(getRouteProtection('/', 'GET')).toBe('public');
      expect(getRouteProtection('/login', 'GET')).toBe('public');
      expect(getRouteProtection('/register', 'GET')).toBe('public');
      expect(getRouteProtection('/prompts', 'GET')).toBe('public');
      expect(getRouteProtection('/discover', 'GET')).toBe('public');
      expect(getRouteProtection('/about', 'GET')).toBe('public');
    });

    it('should identify public API routes', () => {
      expect(getRouteProtection('/api/health', 'GET')).toBe('public');
      expect(getRouteProtection('/api/leaderboard', 'GET')).toBe('public');
      expect(getRouteProtection('/prompts.json', 'GET')).toBe('public');
    });

    it('should allow GET to public read-only APIs', () => {
      expect(getRouteProtection('/api/prompts', 'GET')).toBe('public');
      expect(getRouteProtection('/api/prompts/search', 'GET')).toBe('public');
      expect(getRouteProtection('/api/search/ai', 'GET')).toBe('public');
    });

    it('should identify public dynamic routes', () => {
      expect(getRouteProtection('/prompts/123', 'GET')).toBe('public');
      expect(getRouteProtection('/categories/tech', 'GET')).toBe('public');
      expect(getRouteProtection('/tags/ai', 'GET')).toBe('public');
      expect(getRouteProtection('/john-doe', 'GET')).toBe('public'); // User profile
    });

    it('should allow GET to prompt sub-resources', () => {
      expect(getRouteProtection('/api/prompts/123', 'GET')).toBe('public');
      expect(getRouteProtection('/api/prompts/123/raw', 'GET')).toBe('public');
      expect(getRouteProtection('/api/prompts/123/comments', 'GET')).toBe('public');
      expect(getRouteProtection('/api/prompts/123/versions', 'GET')).toBe('public');
    });
  });

  describe('protected routes', () => {
    it('should identify protected pages', () => {
      expect(getRouteProtection('/settings', 'GET')).toBe('auth');
      expect(getRouteProtection('/feed', 'GET')).toBe('auth');
      expect(getRouteProtection('/collection', 'GET')).toBe('auth');
      expect(getRouteProtection('/prompts/new', 'GET')).toBe('auth');
      expect(getRouteProtection('/builder', 'GET')).toBe('auth');
    });

    it('should identify protected API routes', () => {
      expect(getRouteProtection('/api/user/profile', 'GET')).toBe('auth');
      expect(getRouteProtection('/api/collection', 'GET')).toBe('auth');
      expect(getRouteProtection('/api/upload', 'POST')).toBe('auth');
      expect(getRouteProtection('/api/improve-prompt', 'POST')).toBe('auth');
    });

    it('should require auth for mutations on public read-only APIs', () => {
      expect(getRouteProtection('/api/prompts', 'POST')).toBe('auth');
      expect(getRouteProtection('/api/prompts', 'PUT')).toBe('auth');
      expect(getRouteProtection('/api/prompts', 'DELETE')).toBe('auth');
    });

    it('should require auth for prompt mutations', () => {
      expect(getRouteProtection('/api/prompts/123', 'PUT')).toBe('auth');
      expect(getRouteProtection('/api/prompts/123', 'PATCH')).toBe('auth');
      expect(getRouteProtection('/api/prompts/123', 'DELETE')).toBe('auth');
      expect(getRouteProtection('/api/prompts/123/comments', 'POST')).toBe('auth');
    });

    it('should require auth for edit pages', () => {
      expect(getRouteProtection('/prompts/123/edit', 'GET')).toBe('auth');
      expect(getRouteProtection('/prompts/123/changes/new', 'GET')).toBe('auth');
    });
  });

  describe('admin routes', () => {
    it('should identify admin pages', () => {
      expect(getRouteProtection('/admin', 'GET')).toBe('admin');
      expect(getRouteProtection('/admin/users', 'GET')).toBe('admin');
      expect(getRouteProtection('/admin/settings', 'GET')).toBe('admin');
    });

    it('should identify admin API routes', () => {
      expect(getRouteProtection('/api/admin/users', 'GET')).toBe('admin');
      expect(getRouteProtection('/api/admin/users/123', 'PUT')).toBe('admin');
      expect(getRouteProtection('/api/admin/tags', 'POST')).toBe('admin');
    });
  });

  describe('default behavior', () => {
    it('should default to auth for unknown routes', () => {
      expect(getRouteProtection('/unknown-route', 'GET')).toBe('auth');
      expect(getRouteProtection('/api/unknown', 'GET')).toBe('auth');
    });
  });
});

describe('shouldSkipMiddleware', () => {
  it('should skip Next.js internals', () => {
    expect(shouldSkipMiddleware('/_next/static/chunk.js')).toBe(true);
    expect(shouldSkipMiddleware('/_next/image')).toBe(true);
  });

  it('should skip favicon', () => {
    expect(shouldSkipMiddleware('/favicon.ico')).toBe(true);
    expect(shouldSkipMiddleware('/favicon-96x96.png')).toBe(true);
  });

  it('should skip Sentry monitoring', () => {
    expect(shouldSkipMiddleware('/monitoring')).toBe(true);
  });

  it('should skip static files', () => {
    expect(shouldSkipMiddleware('/logo.png')).toBe(true);
    expect(shouldSkipMiddleware('/styles.css')).toBe(true);
    expect(shouldSkipMiddleware('/script.js')).toBe(true);
    expect(shouldSkipMiddleware('/fonts/font.woff2')).toBe(true);
  });

  it('should not skip API routes with dots', () => {
    expect(shouldSkipMiddleware('/api/prompts/v1.0')).toBe(false);
  });

  it('should not skip regular pages', () => {
    expect(shouldSkipMiddleware('/login')).toBe(false);
    expect(shouldSkipMiddleware('/prompts')).toBe(false);
    expect(shouldSkipMiddleware('/api/users')).toBe(false);
  });
});
