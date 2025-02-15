import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { middleware } from '../../middleware';
import { updateSession } from '../../utils/supabase/middleware';

// Mock Supabase Client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

// Mock Next.js Response
jest.mock('next/server', () => {
  const actualNext = jest.requireActual('next/server');
  
  const mockResponse = {
    headers: new Headers(),
    cookies: {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    },
    status: 200,
  };

  return {
    ...actualNext,
    NextResponse: {
      next: jest.fn(() => ({
        ...mockResponse,
        headers: new Headers(),
      })),
      redirect: jest.fn(() => ({
        ...mockResponse,
        status: 302,
        headers: new Headers(),
      })),
      json: jest.fn((body, init) => ({
        ...mockResponse,
        status: init?.status || 200,
        body: JSON.stringify(body),
        headers: new Headers(),
      })),
    },
  };
});

describe('Authentication Flow', () => {
  let mockRequest;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create request headers
    const requestHeaders = new Headers();
    requestHeaders.set('x-forwarded-for', '127.0.0.1');
    requestHeaders.set('x-real-ip', '127.0.0.1');
    
    // Setup basic request mock with proper Headers instance
    mockRequest = {
      nextUrl: new URL('http://localhost:3000'),
      headers: requestHeaders,
      cookies: {
        get: jest.fn((name) => ({ value: `mock-cookie-${name}` })),
        set: jest.fn(),
        delete: jest.fn(),
      },
      method: 'GET',
      clone: () => ({
        headers: new Headers(requestHeaders),
      }),
    };

    // Default Supabase mock implementation
    createServerClient.mockImplementation(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));
  });

  describe('Core Authentication', () => {
    it('should handle public and protected routes appropriately', async () => {
      // Test public route access
      mockRequest.nextUrl.pathname = '/auth/signin';
      let response = await middleware(mockRequest);
      expect(response).toBeTruthy();
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Test protected route without auth
      mockRequest.nextUrl.pathname = '/feed';
      response = await middleware(mockRequest);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signin')
      );

      // Test protected route with auth
      createServerClient.mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'test-user-id', username: 'testuser' },
          error: null 
        }),
      }));

      response = await middleware(mockRequest);
      expect(response).toBeTruthy();
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1); // Still 1 from previous call
    });
  });

  describe('Session Management', () => {
    it('should handle session states correctly', async () => {
      // Test valid session
      createServerClient.mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'test-user-id', username: 'testuser' },
          error: null 
        }),
      }));

      let response = await updateSession(mockRequest);
      expect(response).toBeTruthy();
      expect(NextResponse.next).toHaveBeenCalled();

      // Test missing session
      createServerClient.mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { name: 'AuthSessionMissingError' },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }));

      response = await updateSession(mockRequest);
      expect(response).toBeTruthy();
      expect(mockRequest.cookies.delete).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce basic rate limiting', async () => {
      // Make 6 requests (limit is 5 per minute)
      const responses = await Promise.all(
        Array(6).fill(null).map(() => middleware(mockRequest))
      );
      
      // First 5 should be allowed
      responses.slice(0, 5).forEach(response => {
        expect(response.status).not.toBe(429);
      });
      
      // 6th should be rate limited
      expect(responses[5].status).toBe(429);
    });
  });
});
