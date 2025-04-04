import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log("🔹 req.user:", req.user);  // Debugging

        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: "Unauthorized. User not found in request." });
        }

        const { name } = req.body;

        const loggedInUser = await userModel.findOne({ email: req.user.email });

        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found in database" });
        }

        const userId = loggedInUser._id;
        const newProject = await projectService.createProject({ name, userId });

        return res.status(201).json(newProject);
    } catch (err) {
        console.error("Error in createProject:", err);
        return res.status(500).json({ error: err.message });
    }
};
