<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">注册</h1>
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <Input
            id="username"
            :value="userData.username"
            @update:value="userData.username = $event"
            placeholder="请输入用户名"
            :disabled="isLoading"
          />
          <p v-if="errors.username" class="error-message">
            {{ errors.username }}
          </p>
        </div>

        <div class="form-group">
          <label for="email">电子邮箱</label>
          <Input
            id="email"
            :value="userData.email"
            @update:value="userData.email = $event"
            placeholder="请输入电子邮箱"
            :disabled="isLoading"
          />
          <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <Input
            id="password"
            :value="userData.password"
            @update:value="userData.password = $event"
            type="password"
            placeholder="请输入密码"
            :disabled="isLoading"
          />
          <p v-if="errors.password" class="error-message">
            {{ errors.password }}
          </p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <Input
            id="confirmPassword"
            :value="userData.confirmPassword"
            @update:value="userData.confirmPassword = $event"
            type="password"
            placeholder="请再次输入密码"
            :disabled="isLoading"
          />
          <p v-if="errors.confirmPassword" class="error-message">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <button type="submit" class="auth-button" :disabled="isLoading">
          {{ isLoading ? "注册中..." : "注册" }}
        </button>

        <p v-if="errorMessage" class="global-error">{{ errorMessage }}</p>
      </form>

      <div class="auth-footer">
        <p>已有账号? <router-link to="/login">登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Input from "@/components/Input.vue";
import type { RegisterData } from "./auth";

const router = useRouter();
const userData = reactive<RegisterData>({
  username: "",
  email: "",
  password: "",
  nickName:"",
  confirmPassword: "",
});
const errors = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const errorMessage = ref("");
const isLoading = ref(false);

const validateForm = (): boolean => {
  let isValid = true;
  errors.username = "";
  errors.email = "";
  errors.password = "";
  errors.confirmPassword = "";

  if (!userData.username.trim()) {
    errors.username = "用户名不能为空";
    isValid = false;
  } else if (userData.username.length < 3) {
    errors.username = "用户名至少需要3个字符";
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.email.trim()) {
    errors.email = "邮箱不能为空";
    isValid = false;
  } else if (!emailRegex.test(userData.email)) {
    errors.email = "请输入有效的邮箱地址";
    isValid = false;
  }

  if (!userData.password) {
    errors.password = "密码不能为空";
    isValid = false;
  } else if (userData.password.length < 6) {
    errors.password = "密码至少需要6个字符";
    isValid = false;
  }

  if (!userData.confirmPassword) {
    errors.confirmPassword = "请确认密码";
    isValid = false;
  } else if (userData.password !== userData.confirmPassword) {
    errors.confirmPassword = "两次输入的密码不一致";
    isValid = false;
  }

  return isValid;
};

const handleRegister = async () => {
  if (!validateForm()) return;

  errorMessage.value = "";
  isLoading.value = true;

  try {
    // const response = await authService.register(userData);
    // authService.saveToken(response.token);
    router.push("/dashboard");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "注册失败，请稍后再试";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
@import url("@/assets/styles/auth.scss");
</style>
