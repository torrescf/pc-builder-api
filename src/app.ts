import 'express-async-errors';
import express from 'express';
import dotenv from 'dotenv';

import { errorMiddleware } from './middlewares/error';
import componentRoutes from './routes/component.routes';
import budgetRoutes from './routes/budget.routes';
dotenv.config();

const app = express();

const PORT = process.env.API_PORT ?? 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'PC Gamer API funcionando!',
  });
});

app.use(componentRoutes);
app.use(budgetRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
