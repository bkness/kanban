import { useEffect } from "react";
import KanbanBoard from "./components/KanbanBoard"
import Navbar from "./components/Navbar";
import ShortcutsHelp from "./components/ShortcutsHelp";
import AuthDialog from "./components/AuthDialog";
import SyncNotice from "./components/SyncNotice";
import { useAuthStore } from "./sync/authStore";
import { useShortcuts } from "./hooks/useShortcuts";

// Must not render <body>: the page already has one, and React 19 treats
// <body> as a singleton it takes over — that left the tree inconsistent and
// React's event lookup looped forever on the first text input's
// selectionchange (the whole tab froze).
export default function App() {
  useShortcuts();
  // Restore a signed-in session (or settle into guest mode) once on load
  useEffect(() => { void useAuthStore.getState().init(); }, []);
  return (
    <div className="app">
      <Navbar />
      <KanbanBoard />
      <ShortcutsHelp />
      <AuthDialog />
      <SyncNotice />
    </div>
  );
}
