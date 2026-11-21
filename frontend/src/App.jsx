import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AppLayout from "./AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadNotes from "./pages/UploadNotes";
import AIChat from "./pages/AIChat";
import ImportantQuestions from "./pages/ImportantQuestions";
import Quiz from "./pages/Quiz";
import PreviousPaper from "./pages/PreviousPaper";
import SavedAnalyses from "./pages/SavedAnalyses";
import StudyPlan from "./pages/StudyPlan";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Logged-in pages share the sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload-notes" element={<UploadNotes />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/important-questions" element={<ImportantQuestions />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/previous-paper" element={<PreviousPaper />} />
          <Route path="/saved-analyses" element={<SavedAnalyses />} />
          <Route path="/study-plan" element={<StudyPlan />} />
        </Route>

        {/* Unknown page */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;