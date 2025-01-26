const Note = require("../models/Note");

/* CREATE */
exports.createNote = async (newNote) => {
  try {
    const note = new Note(newNote);
    const savedNote = await note.save();
    return savedNote;
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
};

exports.createMultipleNotes = async (notesArray) => {
  try {
    if (!Array.isArray(notesArray) || notesArray.length === 0) {
      throw new Error("Notes data must be a non-empty array.");
    }

    const savedNotes = await Note.insertMany(notesArray);
    return savedNotes;
  } catch (error) {
    console.error("Error creating multiple notes:", error);
    throw error;
  }
};

exports.createNoteTest = async (req, res) => {
  try {
    const body = req.body.data;
    const newNote = new Note(body);
    const savedNote = await newNote.save();
    return res.status(200).json(savedNote.toObject);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

/* READ */
exports.readNotes = async (req, res) => {
  try {
    const notes = await Note.find({});
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

exports._readNotes = async (filter) => {
  try {
    const notes = await Note.find(filter).sort({ createdAt: 1 });
    return notes;
  } catch (error) {
    console.error(error);
    throw new Error("There was a problem reading notes.");
  }
}

exports.readLatestNote = async (req, res) => {
  const eventId = req.body.id;
  try {
    const latestNote = await Note.findOne({ eventId: eventId }).sort({
      createdAt: -1,
    });
    res.status(200).json(latestNote);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

exports.readEventNotes = async (req, res) => {
  const eventId = req.params.id;
  try {
    const notes = await Note.find({ eventId: eventId }).populate("userId");
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

/* UPDATE */
exports.updateNote = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};
