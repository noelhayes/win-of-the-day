require('@testing-library/jest-dom');

// Mock Next.js Response and Request
class Headers {
  constructor(init) {
    this._headers = new Map(Object.entries(init || {}));
  }

  get(key) {
    return this._headers.get(key);
  }

  set(key, value) {
    this._headers.set(key, value);
  }
}

class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }
}

// Create a response object factory
const createMockResponse = (status = 200, body = null) => ({
  status,
  body,
  headers: new Headers(),
  cookies: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }
});

// Mock Next.js NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn().mockImplementation(() => createMockResponse()),
      redirect: jest.fn().mockImplementation((url) => createMockResponse(302)),
      json: jest.fn().mockImplementation((body, init) => createMockResponse(init?.status || 200, JSON.stringify(body))),
    }
  };
});

global.Response = Response;
global.Headers = Headers;
global.Request = class Request {};

// Mock URL
global.URL = class URL {
  constructor(url) {
    this.pathname = url;
    this.origin = 'http://localhost:3000';
  }
};

// Mock process.env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'example-anon-key';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
