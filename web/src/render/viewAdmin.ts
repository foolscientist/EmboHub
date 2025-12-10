import { api, authFetch, mount } from "../api";

export default async function viewAdmin() {
  const me = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : await api.me();
  if (me.role !== "admin") {
    location.hash = "#login";
    return;
  }
  const health = await api.health();
  const all = await api.listModels();
  mount(
    `<div class="container"><div class="card"><div class="row"><strong>系统状态</strong><span class='muted'>数据库：${health.db}</span><span class='muted'>存储路径：${health.storage_dir}</span></div></div><div class="card"><h3>管理</h3><div class='grid'>${all.map((m) => `<div class='row' style='justify-content:space-between'><span>${m.name} · <span class='muted'>${m.slug}</span></span><div class='row'><button class='btn danger' data-del='${m.id}'>删除模型</button></div></div>`).join("")}</div></div></div>`,
  );
  Array.from(
    document.querySelectorAll(
      "button[data-del]",
    ) as NodeListOf<HTMLButtonElement>,
  ).forEach((btn: HTMLButtonElement) => {
    btn.onclick = async () => {
      const id = Number(btn.getAttribute("data-del"));
      if (!id) return;
      try {
        await authFetch("DELETE", `/models/${id}`);
        viewAdmin();
      } catch (e) {
        alert("删除失败");
      }
    };
  });
}
