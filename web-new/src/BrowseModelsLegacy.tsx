import React, { useEffect, useState } from "react";
import ModelCard from "@/components/ModelCard";
import * as api from "@/api";
import { type LegacyModelOut } from "@/types/model";
import ModelCardLegacy from "./components/ModelCardLegacy";

const BrowseModels = () => {
  const [models, setModels] = useState<LegacyModelOut[]>([]);
  const [filters, setFilters] = useState({
    q: "",
    tags: "",
    sort: "updated_at",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const list = await api.legacyListModels(
          filters.q,
          filters.tags,
          filters.sort,
        );
        setModels(list);
      } catch (error) {
        console.log("Error fetching models: " + error);
      }
    };
    fetchData();
  }, [filters]); // Only re-run effect if `filters` state changes

  type InputChange =
    | React.ChangeEvent<HTMLSelectElement>
    | React.ChangeEvent<HTMLInputElement>;
  const handleInputChange = (e: InputChange) => {
    setFilters({ ...filters, [e.target.id]: e.target.value });
  };

  return (
    <div className="container">
      <div className="card">
        <h3>模型浏览与检索</h3>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 160px" }}>
          <input
            id="q"
            placeholder="标识"
            value={filters.q}
            onChange={handleInputChange}
          />
          <input
            id="tags"
            placeholder="标签（逗号分隔）"
            value={filters.tags}
            onChange={handleInputChange}
          />
          <select id="sort" value={filters.sort} onChange={handleInputChange}>
            <option value="updated_at">按更新时间</option>
            <option value="downloads">按下载量</option>
          </select>
        </div>
        <div className="row">
          <button className="btn primary">搜索</button>
          {/* You may want to wrap this button in an onClick event that updates localStorage and calls viewBrowse() */}
        </div>
      </div>
      <div className="grid">
        {models.length === 0 ? ( // If there are no models, display a message
          <div className="card">
            <div className="row">
              <span className="muted">暂无模型</span>
            </div>
          </div>
        ) : (
          models.map((model) => (
            <ModelCardLegacy key={model.id} model={model} />
          )) // Otherwise, map each model to a ModelCard component
        )}
      </div>
    </div>
  );
};

export default BrowseModels;
