import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import { fireAuth } from "../integrations/firebase"

import Browse from "../views/Browse.vue";
import Settings from "../views/Settings.vue";
import Admin from "../views/Admin.vue";
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Browse,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/browse",
    name: "Browse",
    component: Browse,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/settings",
    name: "Setting",
    component: Settings,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: {
      requiresGuest: true
    }
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: {
      requiresGuest: true
    }
  }
];

const router = new VueRouter({
  mode: "history",
  routes
});

router.beforeEach((to, from, next) => {
  const user = fireAuth.currentUser;
  if (to.matched.some(route => route.meta.requiresAuth)) {
      if (user) {
          next();
      } else {
          next({
              name: "Login"
          });
      }
  } else {
      next();
  }
  if (to.matched.some(route => route.meta.requiresGuest)) {
      if (!user) {
          next();
      } else {
          next({
              name: "Browse"
          });
      }
  } else {
      next();
  }
});

export default router;
