import React from "react";
import { type LegacyModelOut } from "@/types/model";

type LagacyModelCardProps = {
  model: LegacyModelOut;
};

const ModelCardLegacy: React.FC<LagacyModelCardProps> = ({ model }) => (
  <div className="list-item">
    <div className="row" style={{ justifyContent: "space-between" }}>
      <strong>{model.name}</strong>
      <span className="muted">下载 {model.download_count || 0}</span>
    </div>
    <div className="muted">标识：{model.slug}</div>
    <div className="muted">标签：{model.tags || ""}</div>
    <div className="row">
      <button
        className="btn"
        onClick={() => (window.location.hash = `#model-${model.id}`)} // This might not work if you are using a router library like react-router
      >
        详情
      </button>
    </div>
  </div>
);

export default ModelCardLegacy;
