import { useEffect, useState } from "react";
import * as api from "@/api";
import { type ModelInfo } from "@/types/model";
import { useParams } from "react-router-dom";

function ModelTags({ tags }: { tags: Record<string, any> }) {
  return (
    <div className="model-tags">
      {Object.entries(tags).map(([key, value], index) => (
        <p key={index}>
          <b>{key}:</b> <span>{value}</span>
        </p>
      ))}
    </div>
  );
}

interface State {
  loading: boolean;
  error?: Error;
  model?: ModelInfo;
  files?: api.ModelFileEntry[];
}

export default function ModelDetail() {
  return <h1> ModelDetail</h1>;
}

export function ModelDetail1() {
  const params = useParams();
  const modelId = params.modelId as string;
  const [state, setState] = useState<State>({
    loading: true,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [model, files] = await Promise.all([
          api.getModel(modelId),
          api.listModelFiles(modelId),
        ]);
        setState({ loading: false, model, files });
      } catch (error) {
        console.log("Error fetching data", error);
        setState({ loading: false, error: error as Error });
      }
    }

    fetchData();
  }, [params.modelId]);

  const { loading, error, model, files } = state;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!model || !files) return <h1> NOT FOUND </h1>; // Or a custom not found view

  return (
    <div className="container">
      <div className="row">
        <button className="btn" onClick={() => (location.hash = "#models")}>
          Back to list
        </button>
        <button className="btn" onClick={() => (location.hash = "#new")}>
          New model
        </button>
      </div>
      <div className="card">
        <h2 id="model-name">{model.name}</h2>
        <div className="muted">{model.description || ""}</div>
        <ModelTags tags={model.tags} />
      </div>
      <div className="card">
        <h3 id="file-list-header">File List</h3>
        <div className="grid" id="filesBox">
          {files.map((file) => (
            <div
              key={file.id}
              className="row"
              style={{ justifyContent: "space-between" }}
            >
              <span>
                {file.filename} ·{" "}
                {Math.round((file.size / 1024 / 1024) * 10) / 10}MB
              </span>
              <a
                className="btn"
                href={api.downloadUrl(file.id)}
                target="_blank"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
