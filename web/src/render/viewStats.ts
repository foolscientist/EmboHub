import { api, mount } from "../api";

export default async function viewStats() {
  const all = await api.listModels();
  let size = 0;
  for (const m of all) {
    const fls = await api.listModelFiles(m.id);
    for (const f of fls) {
      size += f.size;
    }
  }
  const totalDownloads = all.reduce((a, b) => a + (b.download_count || 0), 0);
  const toMB = Math.round((size / 1024 / 1024) * 10) / 10;
  const hot = all
    .slice()
    .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
    .slice(0, 10);
  mount(
    `<div class="container"><div class="row"><div class="card"><div class="row"><strong>总模型数</strong><span>${all.length}</span></div></div><div class="card"><div class="row"><strong>总下载量</strong><span>${totalDownloads}</span></div></div><div class="card"><div class="row"><strong>仓库大小</strong><span>${toMB} MB</span></div></div></div><div class="card"><div class="row"><strong>热门模型榜</strong><select id='range'><option value='7'>近7天</option><option value='30'>近30天</option></select><span class='muted'>尚未支持按时间统计</span></div><div class="grid">${hot.map((m) => `<div class='row' style='align-items:center'><span style='flex:1'>${m.name}</span><span class='muted' style='width:90px;text-align:right'>下载 ${m.download_count || 0}</span><button class='btn' style='width:64px' onclick="location.hash='#model-${m.id}'">详情</button></div>`).join("")}</div></div></div>`,
  );
}
