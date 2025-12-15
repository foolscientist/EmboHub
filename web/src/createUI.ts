import { api, authHeader, mount } from "./api.js";
import viewBrowse from "./render/viewBrowse.js";
import viewLogin from "./render/viewLogin.js";
import viewCreate from "./render/viewCreate.js";
import viewMe from "./render/viewMe.js";
import viewModel from "./render/viewModel.js";
import viewStats from "./render/viewStats.js";
import renderNav from "./render/renderNav.js";
import viewAdmin from "./render/viewAdmin.js";
import { clearPendingFiles, pendingFiles } from "./globalState.js";

export function enhanceCreateUI() {
  if (location.hash !== "#new") return;
  const card = document.querySelector(".container .card");
  if (!card) return;
  if (document.getElementById("createUpload")) return;
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `<input type='file' id='fileCreate' /><button id='createUpload' class='btn primary'>创建并上传</button>`;
  card.appendChild(row);
  const prog = document.createElement("div");
  prog.className = "progress";
  prog.style.marginTop = "8px";
  prog.innerHTML = `<div id='createBar' class='progress-bar'></div>`;
  card.appendChild(prog);
  const msg = document.createElement("div");
  msg.id = "createMsg";
  msg.className = "muted";
  msg.style.marginTop = "8px";
  card.appendChild(msg);
  const btn = document.getElementById("createUpload")! as HTMLButtonElement;
  btn.onclick = async () => {
    const name = (document.getElementById("name")! as HTMLInputElement).value;
    const slug = (document.getElementById("slug")! as HTMLInputElement).value;
    const err = document.getElementById("err")! as HTMLInputElement;
    const bar = document.getElementById("createBar")!;
    const fileEl = document.getElementById("fileCreate")! as HTMLInputElement;
    const file = fileEl && fileEl.files && fileEl.files[0];
    const msgEl = document.getElementById("createMsg")!;
    const descEl = document.getElementById("desc") as HTMLInputElement;
    const tagsEl = document.getElementById("tags") as HTMLInputElement;
    if (!name || !slug) {
      err.textContent = "请填写名称和标识";
      return;
    }
    if (!file) {
      msgEl.textContent = "请选择文件";
      return;
    }
    const payload = {
      name,
      slug,
      description: descEl.value,
      tags: tagsEl.value,
    };
    try {
      const m = await api.createModel(payload);
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/models/${m.id}/upload`);
        const h = authHeader();
        Object.entries(h).forEach(([k, vv]) => xhr.setRequestHeader(k, vv));
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            bar.style.width = pct + "%";
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve(xhr.responseText)
            : reject(new Error(xhr.status.toString()));
        xhr.onerror = () => reject(new Error("network"));
        const fd = new FormData();
        fd.append("f", file);
        xhr.send(fd);
      });
      location.hash = `#model-${m.id}`;
    } catch (e) {
      msgEl.textContent = "创建或上传失败";
    }
  };
}

export function enhanceCreateUINew() {
  if (location.hash !== "#new") return;
  const card = document.querySelector(".container .card");
  if (!card) return;
  const existed = document.getElementById("createUpload");
  if (!existed) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<input type='file' id='fileCreate' multiple style='display:none' /><button id='pickFiles' class='btn'>选择文件</button><button id='createUpload' class='btn primary'>创建并上传</button><button id='backBtn' class='btn'>返回列表</button>`;
    card.appendChild(row);
    const prog = document.createElement("div");
    prog.className = "progress";
    prog.style.marginTop = "8px";
    prog.innerHTML = `<div id='createBar' class='progress-bar'></div>`;
    card.appendChild(prog);
    const msg = document.createElement("div");
    msg.id = "createMsg";
    msg.className = "muted";
    msg.style.marginTop = "8px";
    card.appendChild(msg);
    const list = document.createElement("div");
    list.id = "fileList";
    list.className = "muted";
    list.style.marginTop = "8px";
    list.style.whiteSpace = "pre-line";
    card.appendChild(list);
  }
  const fileEl = document.getElementById("fileCreate")! as HTMLInputElement;
  const pickBtn = document.getElementById("pickFiles");
  if (pickBtn && fileEl) {
    pickBtn.onclick = () => fileEl.click();
  }
  if (fileEl) {
    try {
      fileEl.style.minWidth = "auto";
      fileEl.style.width = "180px";
    } catch (e) {}
    fileEl.addEventListener("change", () => {
      const arr = fileEl && fileEl.files ? Array.from(fileEl.files) : [];
      for (const f of arr) {
        if (
          !pendingFiles.some(
            (x: any) =>
              x.name === f.name &&
              x.size === f.size &&
              x.lastModified === f.lastModified,
          )
        ) {
          pendingFiles.push(f);
        }
      }
      fileEl.value = "";
      const names = pendingFiles.map(
        (f: File) =>
          `${f.name} · ${Math.round((f.size / 1024 / 1024) * 10) / 10}MB`,
      );
      const fn = document.getElementById("fileNames");
      if (fn) fn.textContent = names.length ? names.join("；") : "";
      const fl = document.getElementById("fileList");
      if (fl) fl.textContent = names.length ? names.join("\n") : "";
      const bar = document.getElementById("createBar");
      if (bar) bar.style.width = "0%";
    });
  }
  const btn = document.getElementById("createUpload")! as HTMLButtonElement;
  btn.onclick = async () => {
    const name = (document.getElementById("name")! as HTMLInputElement).value;
    const slug = (document.getElementById("slug")! as HTMLInputElement).value;
    const err = document.getElementById("err")!;
    const bar = document.getElementById("createBar")!;
    const files = pendingFiles.slice();
    const msgEl = document.getElementById("createMsg")!;
    if (!name || !slug) {
      err.textContent = "请填写名称和标识";
      return;
    }
    if (!files.length) {
      msgEl.textContent = "请选择文件";
      return;
    }

    const descEl = document.getElementById("desc") as HTMLInputElement;
    const tagsEl = document.getElementById("tags") as HTMLInputElement;
    const payload = {
      name,
      slug,
      description: descEl.value,
      tags: tagsEl.value,
    };
    try {
      const m = await api.createModel(payload);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `/models/${m.id}/upload`);
          const h = authHeader();
          Object.entries(h).forEach(([k, vv]) => xhr.setRequestHeader(k, vv));
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              bar.style.width = pct + "%";
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve(xhr.responseText)
              : reject(new Error(xhr.status.toString()));
          xhr.onerror = () => reject(new Error("network"));
          const fd = new FormData();
          fd.append("f", file);
          xhr.send(fd);
        });
        msgEl.textContent = `已上传 ${i + 1}/${files.length}`;
      }
      clearPendingFiles();
      location.hash = `#model-${m.id}`;
    } catch (e) {
      msgEl.textContent =
        e && e.message ? "上传失败：" + e.message : "上传失败";
    }
  };
  const back = document.getElementById("backBtn");
  if (back) {
    back.onclick = () => {
      location.hash = "#models";
    };
  }
}

export function router() {
  renderNav();
  const t = localStorage.getItem("token");
  const h = location.hash || "#models";
  if (!t && h !== "#login") {
    return viewLogin();
  }
  if (h === "#login") return viewLogin();
  if (h === "#models") return viewBrowse();
  if (h === "#new") {
    viewCreate();
    enhanceCreateUINew();
    return;
  }
  if (h === "#me") return viewMe();
  if (h === "#stats") return viewStats();
  if (h.startsWith("#model-"))
    return viewModel(Number(h.replace("#model-", "")));
  if (h === "#admin") return viewAdmin();
  if (h === "#traffic") return viewTraffic();
  return viewBrowse();
}

let global_traf_timer: number | null = null;

async function viewTraffic() {
  const me = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : await api.me();
  if (me.role !== "admin") {
    location.hash = "#login";
    return;
  }
  function render(data) {
    const list = (data.active || [])
      .map(
        (x) =>
          `<div class='list-item'><div class='row' style='justify-content:space-between'><span>${x.filename}</span><span class='muted'>${Math.round(((x.bytes || 0) / 1024 / 1024) * 10) / 10}MB / ${Math.round(((x.total || 0) / 1024 / 1024) * 10) / 10}MB</span></div><div class='progress'><div class='progress-bar' style='width:${x.percent || 0}%'></div></div></div>`,
      )
      .join("");
    mount(
      `<div class='container'>
     <div class='card'>
        <div class='row'>
           <strong>流量监控</strong>
           <span class='muted'>并发目标：5</span>
        </div>
     </div>
    <div class='grid'>
            ${list || `<div class='card'><span class='muted'>暂无活动下载</span></div>`}
    </div>
  </div>`,
    );
  }
  async function load() {
    try {
      const d = await fetch("/system/traffic", { headers: authHeader() }).then(
        (r) => r.json(),
      );
      render(d);
    } catch (e) {
      render({ active: [] });
    }
  }
  await load();
  let myWindow = window as Window;
  if (global_traf_timer) clearInterval(global_traf_timer);
  global_traf_timer = setInterval(load, 1000);
}
