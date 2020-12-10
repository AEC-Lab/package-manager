import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { ipcRenderer } from "electron";
import { IRootState } from ".";
import { User, LoginCredentials, RegisterCredentials } from "../../types/auth";
import firebase, { fireAuth, firestore, fireFunc } from "../integrations/firebase";

export interface IAuthState {
  user: User | null;
}

export const state: IAuthState = {
  user: null
};

export const getters: GetterTree<IAuthState, IRootState> = {
  getUser: state => {
    return state.user;
  }
};

export const mutations: MutationTree<IAuthState> = {
  setUser: (state, user) => {
    state.user = user;
  }
};

let unsubscribe: () => void;

export const actions: ActionTree<IAuthState, IRootState> = {
  async onAuthStateChangedAction(context, user: firebase.User | null) {
    if (user) {
      unsubscribe = await firestore
        .collection("users")
        .doc(user.uid)
        .onSnapshot(snapshot => {
          const docData = snapshot.data();
          const _user: User = {
            email: user.email,
            name: docData?.name,
            roles: docData?.roles,
            uid: user.uid
          };
          context.commit("setUser", _user);
        });
    } else {
      unsubscribe && unsubscribe();
      context.commit("setUser", null);
    }
  },
  async loginWithGoogle() {
    try {
      _authenticate("google");
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async loginWithGithub() {
    try {
      _authenticate("github");
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async loginWithEmailAndPassword(context, credentials: LoginCredentials) {
    if (!(await context.dispatch("checkEmailExists", credentials.email))) {
      throw new Error("No account exists for this email address");
    }
    try {
      // Make sure email is verified
      const emailVerified = await (
        await fireFunc.httpsCallable("isUserEmailVerified")({ email: credentials.email })
      ).data;
      if (!emailVerified) {
        throw new Error(
          "Email address has not yet been verified. You must first verify your email through the link sent to you."
        );
      }

      const user = await fireAuth.signInWithEmailAndPassword(credentials.email, credentials.password);
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async registerWithEmailAndPassword(context, credentials: RegisterCredentials) {
    try {
      const user = await fireAuth.createUserWithEmailAndPassword(credentials.email, credentials.password);
      // After signing in, send email verification link, and immediately sign user out and direct to login w/ message
      user.user?.sendEmailVerification();

      if (user.user && Boolean(credentials.name)) {
        // Wait for document to be created by cloud function before updating 'name' field
        while (!(await context.dispatch("checkUserDocExists", user.user.uid))) {
          await new Promise(resolve => setTimeout(() => resolve(user), 500));
        }
        await firestore
          .collection("users")
          .doc(user.user.uid)
          .update({ name: credentials.name });
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async checkEmailExists(context, email: string) {
    try {
      const methods: string[] = await fireAuth.fetchSignInMethodsForEmail(email);
      if (!methods.length) {
        return false;
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  async sendPasswordResetEmail(context, email: string) {
    try {
      await fireAuth.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  async checkUserDocExists(context, uid: string) {
    const doc = await firestore
      .collection("users")
      .doc(uid)
      .get();
    if (doc.exists) {
      console.log(doc.data());
    }
    return doc.exists;
  },
  async logout() {
    try {
      this.commit("unsubscribeAllListeners", null, { root: true });
      await fireAuth.signOut();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
};

const namespaced = true;

export const auth: Module<IAuthState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};

// PRIVATE FUNCTIONS
function _authenticate(provider: "google" | "github") {
  const authParams = _getAuthParams(provider);
  ipcRenderer.send("authenticate", provider, authParams);
  ipcRenderer.on("tokens", (event, tokens) => {
    _signInWithTokens(provider, tokens);
  });
}

async function _signInWithTokens(provider: "google" | "github", tokens: any) {
  let credential: firebase.auth.AuthCredential;
  if (provider === "google") {
    credential = firebase.auth.GoogleAuthProvider.credential(tokens.id_token, tokens.access_token);
  } else if (provider === "github") {
    credential = firebase.auth.GithubAuthProvider.credential(tokens);
  } else return;
  await fireAuth.signInWithCredential(credential);
}

function _getAuthParams(provider: "google" | "github") {
  switch (provider) {
    case "google":
      return {
        id: process.env.VUE_APP_GOOGLECLIENTID,
        secret: process.env.VUE_APP_GOOGLECLIENTSECRET
      };
    case "github":
      return {
        id: process.env.VUE_APP_GITHUBCLIENTID,
        secret: process.env.VUE_APP_GITHUBCLIENTSECRET
      };
  }
}
