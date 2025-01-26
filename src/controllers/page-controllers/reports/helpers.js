const { _readNotes } = require("../../NoteController");

exports.getCombinedNotesForEvent = async (eventId) => {
    try {
        const notes = await _readNotes({eventId: eventId});
        const combinedNotes = notes.map((note) => note.text).join("\n----------\n"); 
        return combinedNotes; 
    } catch (error) {
        console.error(`Error fetching notes for event ${eventId}:`, error);
        return "Error fetching notes";
    }
};