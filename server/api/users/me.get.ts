import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

export default defineEventHandler((event) => {

    console.log('Received request for /api/users/me')
    // get user info from cookie using prisma
    const token = getCookie(event, 'AccessToken'); // Get the 'token' cookie

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: No token provided'
        });
    }

    // Verify the token and extract user information
    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
        return {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };
    } catch (err) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: Invalid token'
        });
    }
})