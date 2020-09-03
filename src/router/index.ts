import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Browse from "../views/Browse.vue";
import Settings from "../views/Settings.vue";
import Admin from "../views/Admin.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/browse",
    component: Browse
  },
  {
    path: "/settings",
    component: Settings
  },
  {
    path: "/admin",
    component: Admin
  }
];

const router = new VueRouter({
  mode: "history",
  routes
});

router.replace("browse");
export default router;
