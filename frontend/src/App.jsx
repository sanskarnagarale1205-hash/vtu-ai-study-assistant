import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =====================================================
// AUTH PAGES
// =====================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

// =====================================================
// DASHBOARD
// =====================================================

import Dashboard from "./pages/Dashboard";

// =====================================================
// AI TOOLS
// =====================================================

import UploadNotes from "./pages/UploadNotes";
import AIChat from "./pages/AIChat";
import ImportantQuestions from "./pages/ImportantQuestions";
import Quiz from "./pages/Quiz";
import PreviousPaper from "./pages/PreviousPaper";
import SavedAnalyses from "./pages/SavedAnalyses";

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            DEFAULT PAGE
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =================================================
            AUTH
        ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />

        {/* =================================================
            AI TOOL 1
            UPLOAD NOTES
        ================================================= */}

        <Route
          path="/upload-notes"
          element={
            <UploadNotes />
          }
        />

        {/* =================================================
            AI TOOL 2
            AI CHAT
        ================================================= */}

        <Route
          path="/ai-chat"
          element={
            <AIChat />
          }
        />

        {/* =================================================
            AI TOOL 3
            IMPORTANT QUESTIONS
        ================================================= */}

        <Route
          path="/important-questions"
          element={
            <ImportantQuestions />
          }
        />

        {/* =================================================
            AI TOOL 4
            QUIZ
        ================================================= */}

        <Route
          path="/quiz"
          element={
            <Quiz />
          }
        />

        {/* =================================================
            AI TOOL 5
            PREVIOUS YEAR PAPER
        ================================================= */}

        <Route
          path="/previous-paper"
          element={
            <PreviousPaper />
          }
        />

        {/* =================================================
            AI TOOL 6
            SAVED ANALYSES
        ================================================= */}

        <Route
          path="/saved-analyses"
          element={
            <SavedAnalyses />
          }
        />

        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;