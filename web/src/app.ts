import * as schema from "./schemas";
import { router, enhanceCreateUINew } from "./createUI.js";
import renderUserStatus from "./render/renderUserStatus.js";
window.addEventListener("hashchange", () => {
  router();
  enhanceCreateUINew();
  renderUserStatus();
});
router();
enhanceCreateUINew();
renderUserStatus();
