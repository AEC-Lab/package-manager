import { Module, GetterTree, MutationTree, ActionTree } from 'vuex'
import { ipcRenderer } from 'electron'
// const {ipcRenderer} = window.require('electron')
import { IRootState } from '.'
import { User, LoginCredentials, RegisterCredentials } from '../../types/auth'
import firebase, { fireAuth, firestore } from '../integrations/firebase'
import router from '../router'

export interface IAuthState {
    user: User | null
}

export const state: IAuthState = {
    user: null
}

export const getters: GetterTree<IAuthState, IRootState> = {
    getUser: (state) => {
        return state.user
    }
}

export const mutations: MutationTree<IAuthState> = {
    setUser: (state, user) => {
        state.user = user
    }
}

let unsubscribe: () => void;

export const actions: ActionTree<IAuthState, IRootState> = {
    async onAuthStateChangedAction(context, user: firebase.User | null) {
        if (user) {
            console.log(user)
            unsubscribe = await firestore.collection('users').doc(user.uid).onSnapshot(snapshot => {
                const docData = snapshot.data()
                const _user: User = {
                    email: user.email,
                    name: docData?.name,
                    roles: docData?.roles,
                    uid: user.uid
                }
                context.commit("setUser", _user)
            })
        } else {
            unsubscribe && unsubscribe();
            context.commit("setUser", null)
        }
    },
    async loginWithGoogle(context) {
        try {
            _authenticate("google")
        } catch (error) {
            console.log(error)
            throw error
        }
    },
    async loginWithGithub(context) {
        try {
            _authenticate("github")
        } catch (error) {
            console.log(error)
            throw error
        }
    },
    async loginWithEmailAndPassword(context, credentials: LoginCredentials) {
        try {
            const user = await fireAuth.signInWithEmailAndPassword(credentials.email, credentials.password)
            router.push({
                path: "/browse"
            });
            return user
        } catch (error) {
            console.log(error)
            throw error
        }
    },
    async registerWithEmailAndPassword(context, credentials: RegisterCredentials) {
        try {
            const user = await fireAuth.createUserWithEmailAndPassword(credentials.email, credentials.password)
            if (user.user && Boolean(credentials.name)) {
                // Wait for document to be created by cloud function before updating 'name' field
                while (!(await context.dispatch("checkUserDocExists", user.user.uid))) {
                    await new Promise(resolve => setTimeout(() => resolve(), 500))
                }
                await firestore.collection('users').doc(user.user.uid).update({name: credentials.name})
            }
            router.push({
                path: "/browse"
            });
        } catch (error) {
            console.log(error)
            throw error
        }
    },
    async checkUserDocExists(context, uid: string) {
        const doc = await firestore.collection('users').doc(uid).get()
        console.log("return doc exists", doc.exists)
        if (doc.exists) {
            console.log(doc.data())
        }
        return doc.exists
    },
    async logout(context) {
        try {
            await fireAuth.signOut()
            return true
        } catch (error) {
            console.log(error)
            return false
        }
    }
}

const namespaced = true;

export const auth: Module<IAuthState, IRootState> = {
    namespaced,
    state,
    getters,
    mutations,
    actions
}

// PRIVATE FUNCTIONS
function _authenticate(provider: "google" | "github") {
    const authParams = _getAuthParams(provider)
    ipcRenderer.send("authenticate", provider, authParams);
    ipcRenderer.on("tokens", (event, tokens) => {
        _signInWithTokens(provider, tokens);
    });
}

async function _signInWithTokens(provider: "google" | "github", tokens: any) {
    let credential: firebase.auth.AuthCredential
    if (provider === "google") {
        credential = firebase.auth.GoogleAuthProvider.credential(
          tokens.id_token,
          tokens.access_token
        );
    } else if (provider === "github") {
        credential = firebase.auth.GithubAuthProvider.credential(tokens)
    } else return
    await fireAuth.signInWithCredential(credential);
    router.push({
        path: "/browse"
    });
}

function _getAuthParams(provider: "google" | "github") {
    switch(provider) {
        case "google":
            return {
                id: process.env.VUE_APP_GOOGLECLIENTID,
                secret: process.env.VUE_APP_GOOGLECLIENTSECRET,
            }
        case "github":
            return {
                id: process.env.VUE_APP_GITHUBCLIENTID,
                secret: process.env.VUE_APP_GITHUBCLIENTSECRET,
            }
    }
}