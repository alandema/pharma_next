import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  console.log('New request: ' + url);

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/signup',
    '/auth/login',
    '/auth/signup',
    '/_nuxt/',  // Nuxt internal assets
    '/css/',
    '/js/',
    '/images/',
    '/favicon.ico'
  ];

  const adminRoutes = ['/admin', '/api/users/admin'];

  // Check if the request path starts with any public route
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  const isPageRoute = !url.pathname.startsWith('/api/');
  if (isPageRoute) {
    console.log(`Page route accessed: ${url.pathname}, skipping auth middleware.`);
    return;
  }
  // Skip authentication for public routes
  if (isPublicRoute) {
    console.log(`Public route accessed: ${url.pathname}`);
    return;
  }

  const token = getCookie(event, 'AccessToken'); // Get the 'token' cookie

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: No token provided'
    });
  }

  let decoded: JwtPayload;
  // try to decode token to check if it's valid. If not valid, throw error, if valid, proceed with request
  try {
    decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;

    console.log('Decoded token:', decoded);
    event.context.user = decoded; // Set user in context
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid token'
    });
  }

  if (adminRoutes.some(route => url.pathname.startsWith(route))) {
    if (decoded.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Admins only'
      });
    }
  }

  console.log(`User ${decoded.username} with role ${decoded.role} made a request to ${url.pathname}`); 

})