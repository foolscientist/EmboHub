import { api, authHeader, mount } from "../api.js";
import { clearPendingFiles, pendingFiles } from "../globalState.js";

function makeUploadCard(uploadDisabled: any) {
  return `<div class="row">
  <input type="file" id="fileCreate" multiple style="display:none" />
  <button id="pickFiles" class="btn">选择文件</button>
  <button id="createUpload" class="btn primary" ${uploadDisabled ? "disabled" : ""}>创建并上传</button>
  <button id="backBtn" class="btn">返回列表</button>
</div>
<div id="fileList" class="muted" style="margin-top:8px; white-space:pre-line"></div>
<div class="progress" style="margin-top:8px">
  <div id="createBar" class="progress-bar"></div>
</div>
<div id="createMsg" class="muted" style="margin-top:8px"></div>`;
}
export default async function viewCreate() {
  const models = await api.listModels();
  const lastId = Number(localStorage.getItem("new_last_model_id") || "0");
  const lastName = localStorage.getItem("new_last_model_name") || "";
  const formatOption = ({ id, name }, lastId: number) => {
    return `<option value="${id}" ${id === lastId ? "selected" : ""}>${name}</option>`;
  };

  // Then use it in your code like this:
  const options = models.map((model) => formatOption(model, lastId)).join("");
  const uploadDisabled = false;
  const uploadCard = makeUploadCard(uploadDisabled);
  mount(`<div class="container">
       <div class="card">
           <h3>新建模型</h3>
           <div class="grid" style="grid-template-columns: 1fr 1fr">
               <input id="name" placeholder="名称" />
               <input id="slug" placeholder="标识（slug）" />
               <input id="tags" placeholder="标签（逗号分隔）" />
               <input id="desc" placeholder="简介" />
           </div>
           <div class="row">
               <div id="err" class="muted"></div>
           </div>
       </div>
       ${uploadCard}
      </div>`);
  const fe = document.getElementById("fileCreate");
  const fl = document.getElementById("fileList");
  const pick = document.getElementById("pickFiles");
  if (pick && fe) {
    pick.onclick = () => fe.click();
  }
  if (isHtmlInputElement(fe)) {
    fe.addEventListener("change", () => {
      const arr = fe && fe.files ? Array.from(fe.files) : [];
      for (const f of arr) {
        if (
          !pendingFiles.some(
            (x) =>
              x.name === f.name &&
              x.size === f.size &&
              x.lastModified === f.lastModified,
          )
        ) {
          pendingFiles.push(f);
        }
      }
      fe.value = "";
      renderSelectedFiles();
      const bar = document.getElementById("createBar");
      if (bar) bar.style.width = "0%";
    });
  }
  const createBtn = document.getElementById("create");
  if (createBtn)
    createBtn.onclick = async () => {
      const name = (document.getElementById("name") as HTMLInputElement).value;
      const slug = (document.getElementById("slug") as HTMLInputElement).value;
      const err = document.getElementById("err")!;
      if (!name || !slug) {
        err.textContent = "请填写名称和标识";
        return;
      }
      const payload = {
        name,
        slug,
        description: (document.getElementById("desc") as HTMLInputElement)
          .value,
        tags: (document.getElementById("tags") as HTMLInputElement).value,
      };
      try {
        const m = await api.createModel(payload);
        localStorage.setItem("new_last_model_id", String(m.id));
        localStorage.setItem("new_last_model_name", m.name);
        viewCreate();
      } catch (e) {
        err.textContent = e.message || "创建失败";
      }
    };
  const btn = document.getElementById("createUpload");
  if (btn) {
    btn.onclick = async () => {
      const msg = document.getElementById("createMsg")!;
      const bar = document.getElementById("createBar")!;
      const names = document.getElementById("fileNames");
      const files = pendingFiles.slice();
      if (!files.length) {
        msg.textContent = "请选择文件";
        return;
      }
      const name = getInputElementById("name").value;
      const slug = getInputElementById("slug").value;
      const err = document.getElementById("err") as HTMLInputElement;
      if (!name || !slug) {
        err.textContent = "请填写名称和标识";
        return;
      }
      const payload = {
        name,
        slug,
        description: getInputElementById("desc").value,
        tags: getInputElementById("tags").value,
      };
      try {
        const m = await api.createModel(payload);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          await makePromise(m, bar as HTMLInputElement, file);
          msg.textContent = `已上传 ${i + 1}/${files.length}`;
        }
        clearPendingFiles();
        if (names) names.textContent = "";
        const fe2 = document.getElementById("fileCreate") as HTMLInputElement;
        if (fe2) fe2.value = "";
        location.hash = `#model-${m.id}`;
      } catch (e) {
        msg.textContent =
          e && e.message ? "上传失败：" + e.message : "上传失败";
      }
    };
  }
}

function isHtmlInputElement(e: any): e is HTMLInputElement {
  return e && e.tagName === "INPUT";
}

function getInputElementById(id: string) {
  return document.getElementById(id)! as HTMLInputElement;
}

function makePromise(m: any, bar: HTMLInputElement, file: File) {
  return new Promise((resolve, reject) => {
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
}

function renderSelectedFiles() {
  const listEl = document.getElementById("fileList");
  if (!listEl) return;
  listEl.innerHTML = pendingFiles
    .map(
      (f, i) =>
        `<div class="row" style="justify-content:space-between">
            <span>${f.name} · ${Math.round((f.size / 1024 / 1024) * 10) / 10}MB</span>
            <button class="btn" data-remove="${i}">删除</button>
         </div>`,
    )
    .join("");
  let buttons = Array.from(
    listEl.querySelectorAll("button[data-remove]"),
  ) as HTMLButtonElement[];
  buttons.forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.getAttribute("data-remove"));
      if (!Number.isNaN(idx)) {
        pendingFiles.splice(idx, 1);
        renderSelectedFiles();
      }
    };
  });
}
