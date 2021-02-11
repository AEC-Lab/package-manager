import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import { fireAuth } from "../integrations/firebase";

import Browse from "../views/Browse.vue";
import Settings from "../views/Settings.vue";
import Admin from "../views/Admin.vue";
import Developer from "../views/Developer.vue";
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";
import LoginManagement from "../views/auth/LoginManagement.vue";
import PackageEdit from "../views/admin/PackageEdit.vue";
import PackageCreate from "../views/admin/PackageCreate.vue";
import AuthorEdit from "../views/admin/AuthorEdit.vue";

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
    path: "/developer",
    name: "Developer",
    component: Developer,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/help",
    beforeEnter() {
      // Change redirect link to actual help page
      window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    },
    name: "Help",
    meta: {
      requiresAuth: false
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
  },
  {
    path: "/loginManagement",
    name: "LoginManagement",
    component: LoginManagement
  },
  {
    path: "/packages/:packageId/edit",
    name: "PackageEdit",
    component: PackageEdit
  },
  {
    path: "/packages/create",
    name: "PackageCreate",
    component: PackageCreate
  },
  {
    path: "/authors/:authorId/edit",
    name: "AuthorEdit",
    component: AuthorEdit
  }
];

const router = new VueRouter({
  mode: "hash",
  routes
});

// TODO might not be necessary given you can't visit paths directly
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (requiresAuth && !fireAuth.currentUser) {
    next("/login");
  } else {
    next();
  }
});

router.replace("login");
export default router;
