<template>
    <v-card>
        <v-card-text v-if="mode === 'email'">
            <v-form>
                <v-text-field label="Email" v-model="user.email" />
                <v-text-field label="Password" type="password" v-model="user.password" />
                <v-btn @submit="login" @click="login">
                    Login
                </v-btn>
            </v-form>
            <div class="link" @click="() => $router.push('/register')">Register</div>
            <div class="link" @click="() => {}">Forgot password?</div>
            <div class="link" @click="toggleMode">Sign in with Third Party Provider</div>
        </v-card-text>
        <v-card-text v-else-if="mode === 'provider'">
            <v-btn>Sign in with Google</v-btn>
            <v-btn>Sign in with GitHub</v-btn>
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
    user: LoginCredentials = {
        email: '',
        password: ''
    }

    snackbar = false
    snackbarText = ''

    mode: 'email' | 'provider' = 'email'

    toggleMode() {
        this.mode = this.mode === 'email' ? 'provider' : 'email'
    }

    async login() {
        try {
            const _user = await this.$store.dispatch("auth/loginWithEmailAndPassword", this.user);
            this.$router.push({
                path: "/browse"
            });
        } catch (error) {
            this.snackbarText = error
            this.snackbar = true
            console.log(error);
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