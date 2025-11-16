import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import UserExperience from "./pages/UserExperience";
import FeedbackResults from "./pages/FeedbackResults";
import InsightsPage from "./pages/InsightsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/user" element={<UserExperience />} />
        <Route path="/results" element={<FeedbackResults />} />
        <Route path="/insights/:surveyId" element={<InsightsPage />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
