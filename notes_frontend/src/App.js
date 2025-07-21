import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Color palette from requirements
const COLOR_PRIMARY = "#1976d2";
const COLOR_SECONDARY = "#424242";
const COLOR_ACCENT = "#ffb300";

// PUBLIC_INTERFACE: The main Notes App
function App() {
  // Notes state: {id, title, content, created, updated}
  const [notes, setNotes] = useState(() => {
    // Load from localStorage for persistence (app is frontend only)
    try {
      const saved = localStorage.getItem("notes_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const searchInput = useRef();

  // Save notes to localStorage on change
  useEffect(() => {
    localStorage.setItem("notes_v1", JSON.stringify(notes));
  }, [notes]);

  // Filter notes based on search string
  const filteredNotes = notes
    .filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.updated - a.updated);

  useEffect(() => {
    // If notes are present but none selected, select the first filtered
    if (!selectedId && filteredNotes.length > 0)
      setSelectedId(filteredNotes[0].id);
    // If filteredNotes is empty, clear selection
    if (filteredNotes.length === 0) setSelectedId(null);
    // eslint-disable-next-line
  }, [filteredNotes.length]);

  // PUBLIC_INTERFACE: Start creating new note
  function handleNew() {
    setEditing(true);
    setDraft({ title: "", content: "" });
    setSelectedId(null);
  }

  // PUBLIC_INTERFACE: Start editing existing note
  function handleEdit(id) {
    const note = notes.find((n) => n.id === id);
    setDraft({ title: note.title, content: note.content });
    setEditing(true);
    setSelectedId(id);
  }

  // PUBLIC_INTERFACE: Save (create or update) note
  function handleSave() {
    if (!draft.title.trim() && !draft.content.trim()) {
      setEditing(false);
      setDraft({ title: "", content: "" });
      return;
    }
    if (selectedId && notes.some((n) => n.id === selectedId)) {
      // Update existing note
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? {
                ...n,
                title: draft.title.trim(),
                content: draft.content.trim(),
                updated: Date.now(),
              }
            : n
        )
      );
    } else {
      // New note
      const newNote = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        title: draft.title.trim(),
        content: draft.content.trim(),
        created: Date.now(),
        updated: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote.id);
    }
    setEditing(false);
    setDraft({ title: "", content: "" });
  }

  // PUBLIC_INTERFACE: Delete note
  function handleDelete(id) {
    const idx = notes.findIndex((n) => n.id === id);
    if (window.confirm("Delete this note?")) {
      setNotes(notes.filter((n) => n.id !== id));
      // Select next note
      if (selectedId === id) {
        if (filteredNotes.length > 1) {
          setSelectedId(
            filteredNotes[idx === 0 ? 1 : idx - 1 ? idx - 1 : 0].id
          );
        } else setSelectedId(null);
      }
      setEditing(false);
    }
  }

  // PUBLIC_INTERFACE: Handle searching notes
  function handleSearch(e) {
    setSearch(e.target.value);
  }

  // PUBLIC_INTERFACE: Select note
  function handleSelect(id) {
    setSelectedId(id);
    setEditing(false);
  }

  // Handle keyboard shortcuts for better usability
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleNew();
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInput.current && searchInput.current.focus();
      }
      if (e.key === "Escape") {
        setEditing(false);
        setDraft({ title: "", content: "" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, []);

  // Theming
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", COLOR_PRIMARY);
    document.documentElement.style.setProperty("--color-secondary", COLOR_SECONDARY);
    document.documentElement.style.setProperty("--color-accent", COLOR_ACCENT);
  }, []);

  // Get selected note details
  const selectedNote = notes.find((n) => n.id === selectedId);

  // UI
  return (
    <div className="notes-root" data-theme="light">
      <header className="notes-header" style={{ background: COLOR_PRIMARY }}>
        <h1 className="notes-app-title" style={{ color: "#fff" }}>
          📝 Notes
        </h1>
      </header>
      <main className="notes-main">
        {/* Sidebar: Notes list, search, and New button */}
        <section className="sidebar" style={{ borderRight: `1px solid ${COLOR_SECONDARY}` }}>
          <div className="sidebar-top">
            <input
              type="text"
              className="search-box"
              placeholder="Search notes…"
              value={search}
              onChange={handleSearch}
              ref={searchInput}
              style={{
                border: `1px solid ${COLOR_SECONDARY}`,
                marginBottom: 10,
                background: "#fff",
                color: "#222",
              }}
            />
            <button
              className="button-accent"
              style={{ background: COLOR_ACCENT, color: "#fff", width: "100%" }}
              onClick={handleNew}
              title="New Note (Ctrl+N)"
            >
              + New Note
            </button>
          </div>
          <nav className="notes-list">
            {filteredNotes.length === 0 && (
              <div className="empty-list">No notes found.</div>
            )}
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`note-item${selectedId === note.id ? " selected" : ""}`}
                onClick={() => handleSelect(note.id)}
                style={{
                  background:
                    selectedId === note.id
                      ? "rgba(25, 118, 210, 0.12)"
                      : "transparent",
                  borderBottom: `1px solid ${COLOR_SECONDARY}`,
                }}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleSelect(note.id)}
              >
                <div className="note-title">{note.title || <i>(No title)</i>}</div>
                <div className="note-date">
                  {new Date(note.updated).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </nav>
        </section>
        {/* Main editor/viewer area */}
        <section className="editor-area">
          {editing ? (
            <div className="note-editor">
              <input
                className="title-input"
                type="text"
                autoFocus
                spellCheck
                placeholder="Title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={{
                  border: `1px solid ${COLOR_SECONDARY}`,
                  fontWeight: 600,
                  fontSize: "1.2rem",
                }}
              />
              <textarea
                className="content-input"
                placeholder="Write your note here…"
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                spellCheck
                rows={12}
                style={{
                  border: `1px solid ${COLOR_SECONDARY}`,
                }}
              />
              <div className="editor-actions">
                <button
                  className="button-primary"
                  onClick={handleSave}
                  style={{ background: COLOR_PRIMARY, color: "#fff" }}
                >
                  Save
                </button>
                <button
                  className="button-secondary"
                  onClick={() => setEditing(false)}
                  style={{ background: COLOR_SECONDARY, color: "#fff" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedNote ? (
            <div className="note-viewer">
              <h2 style={{ color: COLOR_PRIMARY, margin: "8px 0" }}>
                {selectedNote.title || <span style={{ color: "#888" }}>(No title)</span>}
              </h2>
              <div className="viewer-dates">
                Last updated{" "}
                {new Date(selectedNote.updated).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <article className="note-content" style={{ whiteSpace: "pre-wrap" }}>
                {selectedNote.content || <span style={{ color: "#999" }}>(No content)</span>}
              </article>
              <div className="viewer-actions">
                <button
                  className="button-primary"
                  onClick={() => handleEdit(selectedNote.id)}
                  style={{ background: COLOR_PRIMARY, color: "#fff" }}
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="button-accent"
                  onClick={() => handleDelete(selectedNote.id)}
                  style={{ background: COLOR_ACCENT, color: "#fff" }}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <section className="empty-editor">
              <div style={{ color: "#bbb", textAlign: "center", marginTop: 80 }}>
                <h2>No Note Selected</h2>
                <p>Create a new note or select one from the list.</p>
              </div>
            </section>
          )}
        </section>
      </main>
      {/* Minimal credit / footer */}
      <footer className="notes-footer">
        <span>
          💡 Tip: <kbd>Ctrl+N</kbd> to create, <kbd>Ctrl+F</kbd> to search, <kbd>Esc</kbd> to close editor.
        </span>
      </footer>
    </div>
  );
}

export default App;
