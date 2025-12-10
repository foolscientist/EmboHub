export default function renderUserStatus() {
  const box = document.getElementById("userStatus");
  if (!box) return;
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;
  if (token && user) {
    box.innerHTML = `<span class='muted'>${user.username}</span><button id='logoutBtnTop' class='btn'>退出</button>`;
    const lo = document.getElementById("logoutBtnTop");
    if (lo)
      lo.onclick = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        location.hash = "#login";
      };
  } else {
    box.innerHTML = `<button id='loginBtnTop' class='btn'>登录</button>`;
    const btn = document.getElementById("loginBtnTop");
    if (btn)
      btn.onclick = () => {
        location.hash = "#login";
      };
  }
}
