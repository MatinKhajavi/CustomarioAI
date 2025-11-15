import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import UserExperience from "./pages/UserExperience";
import FeedbackResults from "./pages/FeedbackResults";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/user" element={<UserExperience />} />
        <Route path="/results" element={<FeedbackResults />} />
        <Route path="/" element={<Navigate to="/user" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
