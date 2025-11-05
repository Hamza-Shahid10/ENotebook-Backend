import { Router } from "express";
import mongoose from "mongoose";
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

//Router 3: Update a new note using: PUT "/api/notes/update-note/:id". login required
router.put("/update-note/:id", fetchUser, async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    // create a new note object
    const newNote = {};
    if (title) newNote.title = title;
    if (description) newNote.description = description;
    if (tag) newNote.tag = tag;

    // find a note by id and authozrize the user
    const checkNote = await notesModel.findById(req.params.id);
    if (!checkNote) return res.status(404).json({ message: "Note not found" });
    if (checkNote.user.toString() !== req.user.id) return res.status(401).json({ message: "Not authorized" });

    // update the note
    const updatedNote = await notesModel.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
    res.status(200).json({ message: "Note updated successfully", updatedNote });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

//Router 4: Dekete a existing note using: DELETE "/api/notes/delete-note/:id". login required
router.delete("/delete-note/:id", fetchUser, async (req, res) => {
  try {
    // find a note by id and authozrize the user
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid note id" });
    const note = await notesModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // check if the note belongs to the user
    if (note.user.toString() !== req.user.id) return res.status(401).json({ message: "Not authorized" });

    // update the note
    const deletedNote = await notesModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Note deleted successfully", deletedNote });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
