import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../helpers/api-errors';

interface TokenPayload {
	id: string;
	role: 'ADMIN' | 'CUSTOMER';
	iat: number;
	exp: number;
}

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				role: 'ADMIN' | 'CUSTOMER';
			};
		}
	}
}

export function authMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction,
): void {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		throw new UnauthorizedError('Token de autenticação não fornecido');
	}

	const [scheme, token] = authHeader.split(' ');

	if (scheme !== 'Bearer' || !token) {
		throw new UnauthorizedError(
			'Formato de token inválido (esperado: Bearer <token>)',
		);
	}

	try {
		const secret = process.env.JWT_SECRET;

		if (!secret) {
			throw new Error('JWT_SECRET não configurado');
		}

		const payload = jwt.verify(token, secret) as TokenPayload;

		if (
			!payload ||
			typeof payload !== 'object' ||
			typeof payload.id !== 'string' ||
			(payload.role !== 'ADMIN' && payload.role !== 'CUSTOMER')
		) {
			throw new Error('Payload de token inválido');
		}

		req.user = { id: payload.id, role: payload.role };
		next();
	} catch {
		throw new UnauthorizedError('Token inválido ou expirado');
	}
}
export function roleMiddleware(
	allowedRoles: Array<'ADMIN' | 'CUSTOMER'>,
) {
	return (req: Request, _res: Response, next: NextFunction): void => {
		if (!req.user) {
			throw new UnauthorizedError('Usuário não autenticado');
		}

		if (!allowedRoles.includes(req.user.role)) {
			throw new ForbiddenError('Você não tem permissão para acessar este recurso');
		}

		next();
	};
}