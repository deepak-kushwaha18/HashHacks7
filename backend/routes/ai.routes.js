import { Router } from 'express';
import { query } from 'express-validator';
import * as aiController from '../controllers/ai.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
const router = Router();

// Validate and get AI result
router.get('/get-result',
    authMiddleware.authUser,
    [
        query('prompt')
            .trim()
            .notEmpty()
            .withMessage('Prompt is required')
            .isString()
            .withMessage('Prompt must be a string')
            .isLength({ min: 1, max: 1000 })
            .withMessage('Prompt must be between 1 and 1000 characters')
    ],
    aiController.getResult
);

export default router;