import * as schema from "./schemas";
import { router, enhanceCreateUINew } from "./createUI";
import renderUserStatus from "render/renderUserStatus";
window.addEventListener("hashchange", () => {
  router();
  enhanceCreateUINew();
  renderUserStatus();
});
router();
enhanceCreateUINew();
renderUserStatus();
