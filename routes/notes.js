import { Router } from "express";
import notesModel from "../models/NotesModel.js";
import fetchUser from "../middleware/fetchUser.js";
import { body, validationResult } from "express-validator";

const router = Router();

//Route 1: Get all notes using: GET "/api/notes/fetch-all-notes". login required
router.get("/fetch-all-notes", fetchUser, async (req, res) => {
  try {
    const notes = await notesModel.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Route 2: Add a new note using: POST "/api/notes/add-note". login required
router.post("/add-note", fetchUser, [
  body("title").isLength({ min: 4 }).withMessage("Enter a valid title"),
  body("description").isLength({ min: 6 }).withMessage("Enter a valid description"),
], async (req, res) => {
  const errors = validationResult(req);
  // if there are errors, return bad requests and the errors
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, description, tag } = req.body;
    const note = new notesModel({ title, description, tag, user: req.user.id });
    const savedNote = await note.save();
    res.status(201).json({ message: "Note added successfully", savedNote });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
