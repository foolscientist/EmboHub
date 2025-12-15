import { api, mount, type ModelId } from "../api.js";

export default async function viewModel(id: ModelId) {
  const m = await api.getModel(id);
  const files = await api.listModelFiles(id);
  mount(`
  <div class="container">
    <div class="row">
      <button class="btn" onclick="location.hash='#models'">返回列表</button>
      <button class="btn" onclick="location.hash='#new'">新建模型</button>
    </div>
    <div class="card">
      <h2>${m.name}</h2>
      <div class="muted">${m.description || ""}</div>
      <div class="muted">标识：${m.slug}</div>
      <div class="muted">标签：${m.tags || ""}</div>
    </div>
    <div class="card">
      <h3>文件清单</h3>
      <div class="grid" id="filesBox"></div>
    </div>
  </div>`);
  const box = document.getElementById("filesBox")!;
  box.innerHTML = files
    .map(
      (f) => `<div class='row' style='justify-content:space-between'>
                 <span>${f.filename} · ${Math.round((f.size / 1024 / 1024) * 10) / 10}MB</span>
                 <a class='btn' href='${api.downloadUrl(f.id)}' target='_blank'>下载</a>
             </div>`,
    )
    .join("");
}
