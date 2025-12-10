import { api, mount } from "../api";
import * as schemas from "../schemas";
function makeBrowseModelItem(m: schemas.LegacyModelOut) {
  return `<div class='list-item'>
            <div class='row' style='justify-content:space-between'>
              <strong>${m.name}</strong>
              <span class='muted'>下载 ${m.download_count || 0}</span>
            </div>
            <div class='muted'>标识：${m.slug}</div>
            <div class='muted'>标签：${m.tags || ""}</div>
            <div class='row'>
            <button class='btn' onclick="location.hash='#model-${m.id}'">详情</button>
            </div>
          </div>`;
}
export default async function viewBrowse() {
  const last = JSON.parse(localStorage.getItem("browse") || "{}");
  const q = last.q || "";
  const tg = last.tags || "";
  const st = last.sort || "updated_at";
  const list = await api.listModels(q, tg, st);
  mount(
    `<div class="container">
       <div class="card">
         <h3>模型浏览与检索</h3>
         <div class="grid" style="grid-template-columns: 1fr 1fr 160px">
           <input id="q" placeholder="标识" value="${q}" />
           <input id="tags" placeholder="标签（逗号分隔）" value="${tg}" />
           <select id="sort">
             <option value="updated_at" ${st === "updated_at" ? "selected" : ""}>按更新时间</option>
             <option value="downloads" ${st === "downloads" ? "selected" : ""}>按下载量</option>
           </select>
         </div>
         <div class="row">
           <button id="search" class="btn primary">搜索</button>
         </div>
       </div>
       <div class="grid">
         ${list.map(makeBrowseModelItem).join("") || `<div class='card'><div class='row'><span class='muted'>暂无模型</span></div></div>`}
       </div>
    </div>`,
  );
  const getInputValueById = (id: string) => {
    const e = document.getElementById("q");
    if (!e) {
      throw Error(`no element found: ${id}`);
    }
    return (e as HTMLInputElement).value;
  };
  document.getElementById("search")!.onclick = () => {
    const nq = getInputValueById("q");
    const nt = getInputValueById("tags");
    const ns = getInputValueById("sort");
    localStorage.setItem(
      "browse",
      JSON.stringify({ q: nq, tags: nt, sort: ns }),
    );
    viewBrowse();
  };
}
