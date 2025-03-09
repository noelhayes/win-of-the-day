/**
 * Root middleware.js file for Next.js
 * 
 * This file is required to be at the root level for Next.js to detect and use middleware.
 * It imports and re-exports the middleware implementation from utils/supabase/middleware.js
 * 
 * Next.js looks for middleware in specific locations:
 * - /middleware.js or /middleware.ts in the root directory
 * - /src/middleware.js or /src/middleware.ts if using the src directory
 */

import { middleware } from './utils/supabase/middleware';
import { config } from './utils/supabase/middleware';

// Export middleware function and config for Next.js to use
export { middleware, config };
