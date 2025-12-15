import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import App2 from "./App2.tsx";
import SearchPage from "./SearchPage.tsx";
import Login from "./Login.tsx";
import BrowseModels from "./BrowseModels.tsx";
import ModelDetail from "./ModelDetail.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/test">
      <nav>
        <Link to="/home">首页</Link>
        <Link to="/search?q=react">搜索react</Link>
      </nav>

      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/browse" element={<BrowseModels />} />
        <Route path="app2" element={<App2 />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/model/:modelId" element={<ModelDetail />} />
      </Routes>
      <Login />
    </BrowserRouter>
  </StrictMode>,
);
