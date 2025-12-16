import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, Link, HashRouter } from "react-router-dom";
import "./index.css";
import SearchPage from "./SearchPage.tsx";
import Login from "@/pages/Login.tsx";
import BrowseModels from "@/pages/BrowseModels.tsx";
import ModelDetail from "@/pages/ModelDetail.tsx";
import CreateModel from "@/pages/CreateModel.tsx";
import "@/components/NavBar.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <nav className="navbar">
        <Link to="/browse">模型</Link>
        <Link to="/create">创建模型</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/browse" element={<BrowseModels />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/create" element={<CreateModel />} />
        <Route path="/model/:modelId" element={<ModelDetail />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
