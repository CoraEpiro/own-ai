import { User } from '../services/databaseService';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {}; 