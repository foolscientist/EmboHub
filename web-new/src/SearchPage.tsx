import { useSearchParams } from "react-router-dom";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("q"); // 获取 ?q=xxx

  return <div>搜索关键词：{keyword}</div>;
}
