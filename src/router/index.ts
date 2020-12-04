import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import { fireAuth } from "../integrations/firebase";

import Browse from "../views/Browse.vue";
import Settings from "../views/Settings.vue";
import Admin from "../views/Admin.vue";
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
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
    name: "Settings",
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
    component: Login
  },
  {
    path: "/register",
    name: "Register",
    component: Register
  }
];

const router = new VueRouter({
  mode: "hash",
  routes
});

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = fireAuth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// TODO might not be necessary given you can't visit paths directly
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (requiresAuth && !(await getCurrentUser())) {
    next("/login");
  } else {
    next();
  }
});

router.replace("login");
export default router;
