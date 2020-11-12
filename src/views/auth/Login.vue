<template>
    <v-card>
        <v-card-text v-if="mode === 'email'">
            <v-form>
                <v-text-field label="Email" v-model="user.email" />
                <v-text-field label="Password" type="password" v-model="user.password" />
                <v-btn @submit="signInWithEmail" @click="signInWithEmail">
                    Login
                </v-btn>
            </v-form>
            <div class="link" @click="() => $router.push('/register')">Register</div>
            <div class="link" @click="() => {}">Forgot password?</div>
            <div class="link" @click="toggleMode">Sign in with Third Party Provider</div>
        </v-card-text>
        <v-card-text v-else-if="mode === 'provider'">
            <v-btn @click="signInWithGoogle" :loading="btnLoadingGoogle">
                Sign in with Google
                <v-icon
                    right
                    dark
                >
                    mdi-google
                </v-icon>
            </v-btn>
            <v-btn @click="signInWithGithub" :loading="btnLoadingGithub">
                Sign in with GitHub
                <v-icon
                    right
                    dark
                >
                    mdi-github
                </v-icon>
            </v-btn>
            <div class="link" @click="toggleMode">Sign in with Email and Password</div>
        </v-card-text>
        <v-snackbar v-model="snackbar">
            {{ snackbarText }}
            <template v-slot:action="{ attrs }">
                <v-btn
                color="red"
                text
                v-bind="attrs"
                @click="snackbar = false"
                >
                Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { LoginCredentials } from "../../../types/auth"

@Component
export default class Login extends Vue {
    // DATA PROPERTIES
    user: LoginCredentials = {
        email: '',
        password: ''
    }

    snackbar = false
    snackbarText = ''

    btnLoadingGoogle = false
    btnLoadingGithub = false

    mode: 'email' | 'provider' = 'email'

    // METHODS
    toggleMode() {
        this.mode = this.mode === 'email' ? 'provider' : 'email'
    }

    async signInWithEmail() {
        try {
            await this.$store.dispatch("auth/loginWithEmailAndPassword", this.user);
        } catch (error) {
            this.snackbarText = error
            this.snackbar = true
            console.log(error);
        }
    }

    async signInWithGoogle() {
        this.btnLoadingGoogle = true
        try {
            await this.$store.dispatch("auth/loginWithGoogle")
        } catch (error) {
            console.log(error)
        }
    }

    async signInWithGithub() {
        this.btnLoadingGithub = true
        try {
            await this.$store.dispatch("auth/loginWithGithub")
        } catch (error) {
            console.log(error)
        }
    }
}
</script>

<style lang="scss" scoped>
.link {
    cursor: pointer;
    color: rgb(0, 0, 255);
    &:hover {
        color: rgb(101, 101, 216)
    }
}
</style>