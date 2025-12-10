export default function renderNav() {
  const brand = document.getElementById("navBrand")!;
  const nav = document.getElementById("nav")!;
  const token = localStorage.getItem("token")!;
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : null;
  brand.onclick = () => {
    location.hash = "#models";
  };
  document.getElementById("navModels")!.onclick = () => {
    location.hash = "#models";
  };
  document.getElementById("navNew")!.onclick = () => {
    location.hash = "#new";
  };
  document.getElementById("navMe")!.onclick = () => {
    location.hash = "#me";
  };
  document.getElementById("navStats")!.onclick = () => {
    location.hash = "#stats";
  };
  document.getElementById("navAdmin")!.onclick = () => {
    location.hash = "#admin";
  };
  const traff = document.getElementById("navTraffic");
  if (traff)
    traff.onclick = () => {
      location.hash = "#traffic";
    };
  const isAdmin = user && user.role === "admin";
  document.getElementById("navAdmin")!.style.display = isAdmin
    ? "inline-block"
    : "none";
  if (traff) traff.style.display = isAdmin ? "inline-block" : "none";
  const showNav = !!token;
  nav.style.display = showNav ? "flex" : "none";
  const ids = [
    "navModels",
    "navNew",
    "navMe",
    "navStats",
    "navAdmin",
    "navTraffic",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });
  let target = locationHashToNavName(location.hash || "#models");

  if (target) {
    const el = document.getElementById(target);
    if (el) el.classList.add("active");
  }
}

function locationHashToNavName(h: string) {
  if (h === "#models" || h.startsWith("#model-")) return "navModels";
  else if (h === "#new") return "navNew";
  else if (h === "#me") return "navMe";
  else if (h === "#stats") return "navStats";
  else if (h === "#admin") return "navAdmin";
  else if (h === "#traffic") return "navTraffic";
  return null;
}
