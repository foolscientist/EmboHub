import { useEffect, useState, type JSX } from "react";
import * as api from "@/api";
import type { ModelInfo, ModelInfoMetric } from "@/types/model";
import InputModelInfoMetric from "@/components/InputModelInfoMetric";
import InputUploadFiles from "@/components/InputUploadFiles";
import VerticalProgressBar from "@/components/VerticalProgressBar";
import PrettyFileSize from "@/util/PrettyFileSize";
import { useNavigate } from "react-router-dom";

function TextArea(
  name: string,
  placeholder: string | undefined = undefined,
): [string, React.Dispatch<React.SetStateAction<string>>, JSX.Element] {
  const [data, setData] = useState<string>("");
  const element = (
    <p>
      {" "}
      {name} :{" "}
      <textarea
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder={placeholder ? placeholder : `(请输入 ${name})`}
      />{" "}
    </p>
  );
  return [data, setData, element];
}
function TextInput(
  name: string,
  placeholder: string | undefined = undefined,
): [string, React.Dispatch<React.SetStateAction<string>>, JSX.Element] {
  const [data, setData] = useState<string>("");
  const element = (
    <p>
      {" "}
      {name} :{" "}
      <input
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder={placeholder ? placeholder : `(请输入 ${name})`}
      />{" "}
    </p>
  );
  return [data, setData, element];
}

type DetailedTags = Record<string, any>;

interface InputModelMetricProps {
  tags: DetailedTags;
  setTags: React.Dispatch<React.SetStateAction<ModelInfoMetric>>;
}
function InputTags({ tags, setTags }: InputModelMetricProps) {
  return <></>;
}

function makeFullname(...args: any[]) {
  return args.join("-");
}

export default function CreateModel() {
  const [name, setName, inputName] = TextInput("模型名称");
  const [fullName, setFullName] = useState<string>("");
  const [architecture, setArchitecture, inputArchitecture] =
    TextInput("模型架构");
  const [framework, setFramework, inputFramework] = TextInput("模型运行时");
  const [version, setVersion, inputVersion] = TextInput("版本");
  const [description, setDescription, inputDescription] = TextArea("描述");

  const [metric, setMetric] = useState<ModelInfoMetric>({});
  const [tags, setTags] = useState<DetailedTags>({});
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  useEffect(() => {
    setFullName(makeFullname(name, architecture, framework, version));
  }, [name, architecture, framework, version]);

  async function handleUploadModel() {
    if (name === "") {
      setError("请填写名称");
      return;
    }
    if (version === "") {
      setError("请填写版本");
      return;
    }
    const payload: ModelInfo = {
      name: name,
      fullname: fullName,
      architecture: architecture,
      framework: framework,
      version: version,
      description: description,
      metrics: metric,
      tags: tags,
    };
    const m = await api.createModel(payload);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await api.uploadFile(m.id, file, setProgressPercent);
        alert(`已上传 ${i + 1}/${files.length}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(`上传文件 ${i + 1} 失败: ${e.toString()}`);
        }
      }
    }
    const navigate = useNavigate();
    navigate(`/model/${m.id}`);
  }
  return (
    <>
      <h3>上传模型</h3>
      {inputName}
      {inputArchitecture}
      {inputFramework}
      {inputVersion}
      {inputDescription}
      <p style={{ color: "gray" }}>预计模型全名: {fullName}</p>
      <InputModelInfoMetric metric={metric} setMetric={setMetric} />
      <InputTags tags={tags} setTags={setTags} />
      <InputUploadFiles files={files} setFiles={setFiles} />
      <button onClick={handleUploadModel}> 上传模型</button>
      {estimateFileSize(files)}
      {error.length === 0 ? "" : <p style={{ color: "red" }}>error</p>}
      <VerticalProgressBar percent={progressPercent} />
    </>
  );
}

function estimateFileSize(files: File[]) {
  if (files.length === 0) {
    return "";
  }
  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
  }
  return (
    <p> 预计存储大小: {PrettyFileSize.fromBytes(totalSize).toString()} </p>
  );
}
