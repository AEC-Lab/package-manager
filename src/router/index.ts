import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import { fireAuth } from "../integrations/firebase";

import Browse from "../views/Browse.vue";
import Settings from "../views/Settings.vue";
import Admin from "../views/Admin.vue";
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";
import LoginManagement from "../views/auth/LoginManagement.vue";

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
  }
];

const router = new VueRouter({
  mode: "hash",
  routes
});

const getCurrentUser = () => {
  return new Promise<firebase.User | null>((resolve, reject) => {
    const unsubscribe = fireAuth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

const isUserVerified = async () => {
  const user = await getCurrentUser();
  if (!user) return false; // User doesn't exist
  if (user.email) {
    // If the "password" sign-in method is associated with email account, it must be verified
    // If a user has a 3rd party provider with email (e.g. Google), it will automatically set 'emailVerified' to true
    const methods = await fireAuth.fetchSignInMethodsForEmail(user.email);
    if (methods.includes("password")) return user.emailVerified;
    else return true;
  } else {
    // Account provider doesn't require email (e.g. Github)
    return true;
  }
};

// TODO might not be necessary given you can't visit paths directly
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (requiresAuth && !(await isUserVerified())) {
    next("/login");
  } else {
    next();
  }
});

router.replace("login");
export default router;
