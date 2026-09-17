import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import{ prisma } from '../lib/prisma';
import { RegisterDTO, LoginDTO } from '../schemas/auth.schema';
import {
  BadRequestError,
  UnauthorizedError,
} from '../helpers/api-errors';

export async function registerUser(data: RegisterDTO) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new BadRequestError('Este e-mail já está cadastrado');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'CUSTOMER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

export async function loginUser(data: LoginDTO) {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.password,
  );

  if (!passwordMatches) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    secret,
    {
      expiresIn: '1d',
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}