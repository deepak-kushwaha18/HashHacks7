import * as ai from '../services/ai.service.js';
import { validationResult } from 'express-validator';

/**
 * Get AI-generated review for a given code snippet
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

/**
 * Get AI-generated result based on a user prompt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getResult = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await ai.generateResult(prompt);
        return res.status(200).json({ message: result });
    } catch (error) {
        console.error('Error in getResult:', error);
        
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: 'AI service configuration error' });
        }
        
        if (error.message.includes('quota')) {
            return res.status(429).json({ error: 'AI service quota exceeded' });
        }
        
        return res.status(500).json({ error: error.message || 'Failed to generate AI response' });
    }
}
