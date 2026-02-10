<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">登录</h1>
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <Input
            id="username"
            :value="credentials.username"
            @update:value="credentials.username = $event"
            placeholder="请输入用户名"
            :disabled="isLoading"
          />
          <p v-if="errors.username" class="error-message">
            {{ errors.username }}
          </p>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <Input
            type="password"
            id="password"
            :value="credentials.password"
            @update:value="credentials.password = $event"
            placeholder="请输入密码"
            :showPassword="false"
            :disabled="isLoading"
          />
          <p v-if="errors.password" class="error-message">
            {{ errors.password }}
          </p>
        </div>

        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe" />
            <label for="remember">记住我</label>
          </div>
          <router-link to="/forgot" class="forgot-password">
            忘记密码?
          </router-link>
        </div>

        <button type="submit" class="auth-button" :disabled="isLoading">
          {{ isLoading ? "登录中..." : "登录" }}
        </button>

        <p v-if="errorMessage" class="global-error">{{ errorMessage }}</p>
      </form>

      <div class="auth-footer">
        <p>还没有账号? <router-link to="/register">注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Input from "@/components/Input.vue";
import auth from "@/services/auth";
import type { UserCredentials } from "./auth";
const router = useRouter();
const credentials = reactive<UserCredentials>({
  username: "",
  password: "",
});
const errors = reactive({
  username: "",
  password: "",
});
const rememberMe = ref(false);
const errorMessage = ref("");
const isLoading = ref(false);

const validateForm = (): boolean => {
  let isValid = true;
  errors.username = "";
  errors.password = "";

  if (!credentials.username.trim()) {
    errors.username = "用户名不能为空";
    isValid = false;
  }

  if (!credentials.password) {
    errors.password = "密码不能为空";
    isValid = false;
  } else if (credentials.password.length < 6) {
    errors.password = "密码至少需要6个字符";
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  errorMessage.value = "";
  isLoading.value = true;

  try {
    let formdata = new FormData();
    formdata.append("userName", credentials.username);
    formdata.append("password", credentials.password);
    const response = await auth.login(formdata);
    if (rememberMe.value) {
      localStorage.setItem("token", response.data.token);
    } else {
      sessionStorage.setItem("token", response.data.token);
    }
    router.push("/home");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "登录失败，请稍后再试";
  } finally {
    isLoading.value = false;
  }
};

// 检查是否有记住的用户名
const savedUsername = localStorage.getItem("remember_username");
if (savedUsername) {
  credentials.username = savedUsername;
  rememberMe.value = true;
}
</script>
<style scoped lang="scss">
@import url("@/assets/styles/auth.scss");
</style>
