import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { ipcRenderer } from "electron";
import { IRootState } from ".";
import { User, LoginCredentials, RegisterCredentials } from "../../types/auth";
import { UserRole, Provider } from "../../types/enums";
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
  },
  isAdmin: state => {
    return [UserRole.Admin, UserRole.SuperAdmin].some(role => state.user?.roles?.includes(role)) || false;
  },
  isSuperAdmin: state => {
    return state.user?.roles?.includes(UserRole.SuperAdmin) || false;
  }
};

export const mutations: MutationTree<IAuthState> = {
  setUser: (state, user) => {
    state.user = user;
  }
};

let unsubscribe: () => void;

export const actions: ActionTree<IAuthState, IRootState> = {
  /**
   * On firebase Auth state change, set current user
   *
   * @param context - vuex action context
   * @param user - firebase user
   */
  async onAuthStateChangedAction(context, user: firebase.User | null) {
    // eslint-disable-next-line
    return new Promise<void>(async resolve => {
      if (user) {
        console.log(user);
        unsubscribe = await firestore
          .collection("users")
          .doc(user.uid)
          .onSnapshot(async snapshot => {
            const docData = snapshot.data() as User;
            const _user: User = {
              email: user.email,
              name: docData?.name,
              roles: docData?.roles,
              uid: user.uid,
              config: docData?.config,
              githubId: docData?.githubId
            };
            context.commit("setUser", _user);
            resolve();
          });
      } else {
        unsubscribe && unsubscribe();
        context.commit("setUser", null);
        resolve();
      }
    });
  },
  /**
   * Initialize Vuex store with data from Firestore and local config
   *
   * @param context - vuex action context
   * @param user - user document data
   */
  async initializeStoreData(context) {
    const storeInitPromises = [];

    // Load local package config
    storeInitPromises.push(context.dispatch("config/loadLocalConfig", null, { root: true }));

    // Set Firestore collection listeners
    storeInitPromises.push(context.dispatch("packages/packagesListener", null, { root: true }));
    storeInitPromises.push(context.dispatch("authors/authorsListener", null, { root: true }));
    storeInitPromises.push(context.dispatch("enterprises/enterprisesListener", null, { root: true }));

    // Set users listener for Admin users
    if (context.getters["isAdmin"]) {
      storeInitPromises.push(context.dispatch("users/usersListener", null, { root: true }));
    }

    await Promise.all(storeInitPromises);
  },
  /**
   * Authenticate through Google
   *
   * @throws - authentication error
   *
   */
  async loginWithGoogle() {
    try {
      _authenticate(Provider.Google);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async loginWithGithub() {
    try {
      _authenticate(Provider.Github);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async loginWithMicrosoft() {
    try {
      _authenticate(Provider.Microsoft);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  /**
   * log in with email and password credentials
   * @async
   * @param credentials
   * @throws account doesn't exist
   * @throws email not verified
   * @throws log-in failed
   * @returns firebase user
   */
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
  /**
   * register the new user with provided credentials in firebase
   * @async
   * @param credentials - registration data
   * @throws registration failed
   */
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
  /**
   * check that email is a valid sign-in method
   * @async
   * @param email - email to check
   * @returns if email is a valid sign-in method for this email
   */
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
  /**
   * send a password reset email through firebase
   * @async
   * @param email - email for password reset
   * @returns if email is successfully sent
   */
  async sendPasswordResetEmail(context, email: string) {
    try {
      await fireAuth.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  /**
   * check if user exists in firebase
   * @async
   * @param uid - user id
   * @returns - if user exists
   */
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
  /**
   * log out and unsubscribe from all listeners
   * @async
   */
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
/**
 * Kicks off authentication flow
 *
 * @param provider - authenticatin provider
 */
async function _authenticate(provider: Provider) {
  // Handle Microsoft with custom flow
  if (provider === Provider.Microsoft) {
    const provider = new firebase.auth.OAuthProvider("microsoft.com");
    provider.setCustomParameters({
      prompt: "select_account"
    });
    await fireAuth.signInWithRedirect(provider);
    return;
  }

  const authParams = _getAuthParams(provider);
  ipcRenderer.send("authenticate", provider, authParams);
  ipcRenderer.on("tokens", (event, tokens) => {
    _signInWithTokens(provider, tokens);
  });
}

/**
 * Authenticate with firebase usinga sign-in token from the Auth provider
 *
 * @param provider - authentication provider
 * @param tokens - token(s) from the provider
 */
async function _signInWithTokens(provider: Provider, tokenObj: any) {
  let credential: firebase.auth.AuthCredential;
  switch (provider) {
    case Provider.Google:
      credential = firebase.auth.GoogleAuthProvider.credential(tokenObj.id_token, tokenObj.access_token);
      await fireAuth.signInWithCredential(credential);
      break;
    case Provider.Github:
      credential = firebase.auth.GithubAuthProvider.credential(tokenObj);
      await fireAuth.signInWithCredential(credential);
      break;
    case Provider.Microsoft: {
      // ARCHIVE: signInWithCredential not working with Microsoft provider credential
      // const oAuthProvider = new firebase.auth.OAuthProvider("microsoft.com");
      // const credential = oAuthProvider.credential({ accessToken: tokenObj });
      // await fireAuth.signInWithCredential(credential);

      // ARCHIVE: custom auth token flow (unable to link to Microsoft)
      // const customToken = await (await fireFunc.httpsCallable("createCustomToken")({ jwt: tokenObj })).data;
      // console.log(customToken);
      // const user = await fireAuth.signInWithCustomToken(customToken);
      // console.log("user is", user);
      break;
    }
    default:
      return;
  }
}

/**
 * get Auth parameters from process environment
 *
 * @param provider - Auth provider
 *
 * @returns - provider id and secret
 */
function _getAuthParams(provider: Provider) {
  switch (provider) {
    case Provider.Google:
      return {
        id: process.env.VUE_APP_GOOGLECLIENTID,
        secret: process.env.VUE_APP_GOOGLECLIENTSECRET
      };
    case Provider.Github:
      return {
        id: process.env.VUE_APP_GITHUBCLIENTID,
        secret: process.env.VUE_APP_GITHUBCLIENTSECRET
      };
    case Provider.Microsoft:
      return {
        id: process.env.VUE_APP_AZURECLIENTID,
        secret: process.env.VUE_APP_AZURECLIENTSECRET
      };
  }
}
