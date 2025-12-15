// 已收敛到单模型单文件，移除旧版本相关操作

import { api, mount } from "../api.js";

function toMBSize(sizeBytes: number) {
  return Math.round((sizeBytes / 1024 / 1024) * 10) / 10;
}

export default async function viewMe() {
  const me = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : await api.me();
  if (!localStorage.getItem("user"))
    localStorage.setItem("user", JSON.stringify(me));
  const all = await api.listModels();
  const mine = all.filter((m) => m.owner_id === me.id);
  let files = 0,
    size = 0;
  for (const m of mine) {
    const fls = await api.listModelFiles(m.id);
    files += fls.length;
    for (const f of fls) {
      size += f.size;
    }
  }
  const mbSize = toMBSize(size);
  mount(`
  <div class="container">
    <div class="row">
      <div class="card">
        <div class="row">
          <strong>我的模型</strong>
          <span>${mine.length}</span>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <strong>文件数</strong>
          <span>${files}</span>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <strong>占用存储</strong>
          <span>${mbSize} MB</span>
        </div>
      </div>
    </div>
    <div class="grid">
      ${
        mine
          .map(
            (m) => `
        <div class='list-item'>
          <div class='row' style='align-items:center'>
            <strong style='flex:1'>${m.name}</strong>
            <span class='muted' style='width:90px;text-align:right'>下载 ${m.download_count || 0}</span>
          </div>
          <div class='muted'>${m.description || ""}</div>
          <div class='row'>
            <button class='btn' onclick="location.hash='#model-${m.id}'">详情</button>
          </div>
        </div>`,
          )
          .join("") ||
        `<div class='card'>
         <div class='row'>
           <span class='muted'>暂无模型</span>
           <button class='btn primary' onclick="location.hash='#new'">去创建模型</button>
         </div>
       </div>`
      }
    </div>
  </div>
`);
}
