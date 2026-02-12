<template>
  <header class="header">
    <div class="logo">
      <img src="../../assets/images/logo.png" alt="BISM-CC K-Graph" />
      <!-- <span>BISM-CC K-Graph</span> -->
    </div>
    <nav class="nav">
      <el-menu
        :default-active="'1'"
        mode="horizontal"
        background-color="#fff"
        text-color="#666"
        active-text-color="#43D7B5"
      >
        <el-menu-item index="1">本体设计</el-menu-item>
        <el-menu-item index="2">图谱构建</el-menu-item>
        <el-menu-item index="3">探索应用</el-menu-item>
      </el-menu>
    </nav>
    <div class="user">
      <el-dropdown>
        <span class="user-info">
          <img src="../../assets/images/蒙版分组.png" />
          <span>管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <!-- <el-dropdown-item>个人中心</el-dropdown-item> -->
            <el-dropdown-item @click="loginOut">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";
import auth from "@/services/auth";
import type { logout } from "../../services/auth";
import message from "@/utils/message";
import { ElMessageBox } from "element-plus";
const router = useRouter();

const loginOut = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "退出登录", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    const response = await auth.logout();
    if (response.resultCode == "0000") {
      message.success("退出登录成功");
      // 清空本地存储中的 token 和状态
      localStorage.removeItem("token");
      localStorage.removeItem("homePageState");
      sessionStorage.removeItem("token");
      // 强制刷新路由，确保token已清除
      setTimeout(() => {
        router.push("/login");
      }, 100);
    } else {
      message.error("退出登录失败，请稍后再试");
    }
  } catch (error: any) {}
};
</script>
<style scoped lang="scss">
.header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: white;
  box-shadow: 0px 1px 0px 0px rgba(229, 230, 235, 1);
  border-bottom: 1px solid #e5e6eb;
}

.logo {
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.logo img {
  width: 180px;
  height: 40px;
  margin-right: 10px;
}

.logo span {
  font-size: 16px;
  font-weight: 400;
  color: #333;
}

.nav {
  flex: 1;
  margin-left: 100px;
  .el-menu-item {
    font-size: 16px;
    font-weight: 400;
    color: #666666;
    opacity: 0.65;
    padding: 0 2px;
  }
  .el-menu--horizontal > .el-menu-item.is-active {
    border-bottom: 3px solid #2976ff;
    background: #fff;
    font-weight: 600;
    font-size: 16px;
    opacity: 1;
  }
  .el-menu-item:hover {
    background: #fff;
    font-weight: 600;
    font-size: 16px;
    opacity: 1;
  }
  .el-menu--horizontal.el-menu {
    border-bottom: none;
  }
  .el-menu--horizontal {
    gap: 44px;
    height: 70px;
  }
}

.user {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 4px;
  padding: 4px 8px;
  background-color: #ffffff;
  border-radius: 4px;
  transition: all 0.3s ease;
  border: none;
  outline: none;
  box-shadow: none;
  z-index: 1000;
  position: relative;
  img {
    width: 36px;
    height: 36px;
    margin-right: 3px;
    display: block;
    border: none;
    outline: none;
  }
  &:hover {
    background-color: #f5f7fa;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  &:focus {
    outline: none;
    box-shadow: none;
  }
}

.user-info span {
  margin-left: 8px;
  font-size: 14px;
  color: #333333;
  display: block;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .logo span {
    font-size: 16px;
  }

  .nav {
    margin-left: 20px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 10px;
  }

  .logo span {
    display: none;
  }
}
</style>
