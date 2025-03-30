import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {createNote, fetchNotes, fetchCategories, createNoteCategory } from "../../../store/notes/notesAction";
import "./index.css";

const NotesComponent = ({ onClose }) => {
  const dispatch = useDispatch();
  const { categories, notes, loading } = useSelector((state) => state.notes);
  
  const [categoryName, setCategoryName] = useState("");
  const [note, setNote] = useState({ title: "", description: "", todoCategory: "" });
  const [formType, setFormType] = useState("");

  useEffect(() => {
    dispatch(fetchNotes());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCreateCategory = () => {
    if (categoryName) {
      dispatch(createNoteCategory(categoryName));
      setCategoryName("");
      setFormType("");
    }
  };

  const handleCreateNote = () => {
    if (note.title && note.description && note.todoCategory) {
      dispatch(createNote({ ...note, status: "PENDING", priority: "LOW" }));
      setNote({ title: "", description: "", todoCategory: "" });
      setFormType("");
    }
  };

  const renderCategoryForm = () => (
    <div className="input-group">
      <input
        className="input-field"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        placeholder="New Category Name"
      />
      <button className="btn btn-primary" onClick={handleCreateCategory}>Create Category</button>
    </div>
  );

  const renderNoteForm = () => (
    <div className="input-group">
      <select
        className="input-field"
        style={{width:"100%"}}
        value={note.todoCategory}
        onChange={(e) => setNote({ ...note, todoCategory: e.target.value })}
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>{cat.name}</option>
        ))}
      </select>
      <input
        className="input-field"
        value={note.title}
        onChange={(e) => setNote({ ...note, title: e.target.value })}
        placeholder="Note Title"
      />
      <textarea
        className="input-field textarea"
        value={note.description}
        onChange={(e) => setNote({ ...note, description: e.target.value })}
        placeholder="Description"
      />
      <button className="btn btn-success" onClick={handleCreateNote}>Create Note</button>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>✖</button>

        <h2 className="modal-title">📝 Notes</h2>
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => setFormType("category")}
          >
            Create Category
          </button>
          <button
            className="btn btn-success"
            onClick={() => setFormType("note")}
          >
            Create Note
          </button>
        </div>
        {formType === "category" && renderCategoryForm()}
        {formType === "note" && renderNoteForm()}
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : (
          <ul className="notes-list">
            {notes.map((n) => (
              <li key={n._id} className="note-card">
                <div style={{display:"flex", justifyContent:"space-between"}}>
                <h3>{n.title}</h3>
                <span className="priority-label">Priority: {n.priority}</span>
                </div>
                <p style={{textAlign:"start"}}>{n.description}</p>
                
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotesComponent;
