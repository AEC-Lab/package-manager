<template>
    <v-card>
        <v-card-text>
            <v-form v-model="isFormValid" ref="form" lazy-validation>
                <v-text-field label="Name" v-model="user.name" />
                <v-text-field label="Email" v-model="user.email" :rules="emailRules" required lazy-validation />
                <v-text-field label="Password" type="password" v-model="user.password" :rules="passwordRules" required />
                <v-text-field label="Confirm Password" type="password" v-model="user.passwordConfirmation" :rules="passwordConfirmationRules" required />
                <v-btn @submit="register" @click="register">
                    Register
                </v-btn>
            </v-form>
            <div class="link" @click="() => $router.push('/login')">Already registered? Sign in</div>
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
import { RegisterCredentials } from "../../../types/auth"
import { fireAuth } from "../../integrations/firebase"

@Component
export default class Register extends Vue {
    user: RegisterCredentials = {
        email: '',
        name: '',
        password: '',
        passwordConfirmation: ''
    }

    isFormValid = false
    snackbar = false
    snackbarText =  ''

    emailRules = [
        (v: string) => !!v || 'Field is required',
        (v: string) => this.isValidEmail(v) || 'Invalid email',
    ]
    passwordRules = [
        (v: string) => !!v || 'Field is required',
    ]
    passwordConfirmationRules = [
        (v: string) => v === this.user.password || "Passwords do not match"
    ]

    async register() {
        const isValid = (this.$refs.form as Vue & { validate: () => boolean }).validate()
        if (!isValid) return;
        try {
            await this.$store.dispatch("auth/registerWithEmailAndPassword", this.user);
            this.$router.push({
                path: "/browse"
            });
        } catch (error) {
            this.snackbarText = error
            this.snackbar = true
            console.log(error);
        }
    }
    isValidEmail(email: string) {
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line
        return re.test(email);
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