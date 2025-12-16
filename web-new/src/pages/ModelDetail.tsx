import { useEffect, useState } from "react";
import * as api from "@/api";
import { type ModelInfo, type ModelInfoMetric } from "@/types/model";
import { useParams } from "react-router-dom";
import PrettyFileSize from "@/util/PrettyFileSize";

function ModelTags({ tags }: { tags: Record<string, any> }) {
  if (Object.keys(tags).length === 0) {
    return <p> (No Tags)</p>;
  }
  return (
    <ul className="model-tags">
      {Object.entries(tags).map(([key, value], index) => (
        <li key={index}>
          <b>{key}:</b> <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

interface State {
  loading: boolean;
  error?: Error;
  model?: ModelInfo;
  files?: api.ModelFileEntry[];
}

export default function ModelDetail() {
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
      <div className="card">
        <h2 id="model-name">{model.name}</h2>
        <div className="muted">{model.description || ""}</div>
      </div>
      <br />
      <p> Tags: </p>
      <ModelTags tags={model.tags} />
      <br />
      <p> 性能信息: </p>
      <ModelMetricCard metric={model.metrics} />

      <div className="card">
        <h3 id="file-list-header">文件列表</h3>
        <div className="grid" id="filesBox">
          {!Array.isArray(files)
            ? `尚无文件(空), files is ${files}`
            : files.length === 0
              ? "尚无文件"
              : files.map(FileCard)}
        </div>
      </div>
    </div>
  );
}

function ModelMetricCard({ metric }: { metric?: ModelInfoMetric }) {
  if (!metric) {
    return <div>(暂无性能信息)</div>;
  }

  const keys = Object.keys(metric);

  const toTableRow = (key: string, index: number) => {
    //这个as 用于压制 7053错误
    const value = metric[key as keyof ModelInfoMetric];
    if (value === null || value === undefined) {
      return null;
    }
    return (
      <tr key={index}>
        <td>{key}:</td>
        <td>{value}</td>
      </tr>
    );
  };
  const tableRows = keys.map(toTableRow).filter((item) => item != null);
  if (tableRows.length === 0) {
    return <div>(暂无性能信息)</div>;
  }

  return (
    <table className="metric-card">
      <tbody>{tableRows}</tbody>
    </table>
  );
}

function FileCard(file: api.ModelFileEntry) {
  return (
    <div
      key={file.id}
      className="row"
      style={{ justifyContent: "space-between", width: "50%" }}
    >
      <span>
        {file.filename} · {PrettyFileSize.fromBytes(file.size).toString()}
      </span>
      <a className="btn" href={api.downloadUrl(file.id)} target="_blank">
        Download
      </a>
    </div>
  );
}
