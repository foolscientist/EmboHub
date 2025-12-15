import { api, mount } from "../api.js";

function validate(u, p, err) {
  if (!u.value || !p.value) {
    err.textContent = "账号或密码为空";
    return false;
  }
  if (p.value.length < 6) {
    err.textContent = "密码太短, 最少6字符";
    return false;
  }
  err.textContent = "";
  return true;
}

export default function viewLogin() {
  mount(
    `<div class="container"><div class="card">
          <h3>登录 / 注册</h3>
          <div class="grid" style="grid-template-columns: 1fr 1fr">
            <div class="grid">
              <label>用户ID</label>
              <input id="username" placeholder="用户ID" />
            </div>
            <div class="grid">
              <label>密码</label>
              <input id="password" type="password" placeholder="密码" />
            </div>
          </div>
          <div class="row">
            <button id="loginBtn" class="btn primary">登录</button>
            <button id="regBtn" class="btn">注册并登录</button>
            <div id="err" class="muted"></div>
          </div>
    </div></div>`,
  );
  const u = document.getElementById("username")! as HTMLInputElement;
  const p = document.getElementById("password")! as HTMLInputElement;
  const err = document.getElementById("err")! as HTMLInputElement;
  validate(u, p, err);

  document.getElementById("loginBtn")!.onclick = async () => {
    if (!validate(u, p, err)) return;
    try {
      const t = await api.login(u.value, p.value);
      localStorage.setItem("token", t.access_token);
      const me = await api.me();
      localStorage.setItem("user", JSON.stringify(me));
      location.hash = me.role === "admin" ? "#admin" : "#models";
    } catch (e) {
      err.textContent = `账号或密码错误\n${e.name}: ${e.message}`;
    }
  };
  document.getElementById("regBtn")!.onclick = async () => {
    if (!validate(u, p, err)) return;
    try {
      await api.register(u.value, p.value);
      const t = await api.login(u.value, p.value);
      localStorage.setItem("token", t.access_token);
      const me = await api.me();
      localStorage.setItem("user", JSON.stringify(me));
      location.hash = me.role === "admin" ? "#admin" : "#models";
    } catch (e) {
      err.textContent = `账号或密码错误\n${e.name}: ${e.message}`;
    }
  };
}
