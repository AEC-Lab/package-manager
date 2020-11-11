import { Module, GetterTree, MutationTree, ActionTree } from 'vuex'
import { IRootState } from '.'
import { User, LoginCredentials, RegisterCredentials } from '../../types/auth'
import { fireAuth, firestore } from '../integrations/firebase'

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
    async loginWithEmailAndPassword(context, credentials: LoginCredentials) {
        try {
            const user = await fireAuth.signInWithEmailAndPassword(credentials.email, credentials.password)
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