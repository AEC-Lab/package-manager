import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Browse from "../views/Browse.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    component: Browse
  }
];

const router = new VueRouter({
  mode: "history",
  routes
});

export default router;
