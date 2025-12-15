import React from "react";
import { type ModelInfo } from "@/types/model";
import { Link, useNavigate } from "react-router-dom";

type ModelCardProps = {
  model: ModelInfo;
};

function makeTags(tags: Record<string, any>): string {
  var kvs: string[] = [];
  for (const k in tags) {
    const kv = `${k}=${tags[k]}`;
    kvs.push(kv);
  }
  return kvs.join(", ");
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const navigate = useNavigate();
  function onClickNavigate() {
    navigate(`/model/${model.id}`);
  }
  return (
    <div className="list-item">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>
          {model.name} - {model.version}
        </strong>
      </div>
      <div className="muted">标签：{makeTags(model.tags)}</div>
      <div className="row">
        <Link to={`/model/${model.id}`}>详情</Link>
      </div>
    </div>
  );
};

export default ModelCard;
