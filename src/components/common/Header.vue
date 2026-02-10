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
        <el-menu-item index="2">图结构建</el-menu-item>
        <el-menu-item index="3">探索应用</el-menu-item>
      </el-menu>
    </nav>
    <div class="user">
      <el-dropdown>
        <span class="user-info">
          <el-avatar
            size="small"
            :src="'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%2C%20professional%20look&image_size=square'"
          />
          <span>管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
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
  margin-left: 40px;
  .el-menu-item {
    font-size: 16px;
    font-weight: 600;
    color: #666;
    opacity: 0.66;
  }
  .el-menu--horizontal > .el-menu-item.is-active {
    border-bottom: 3px solid #2976ff;
    background: #fff;
    font-weight: 600;
    font-size: 16px;
  }
  .el-menu-item:hover {
    background: #fff;
    font-weight: 600;
    font-size: 16px;
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
}

.user-info span {
  margin-left: 8px;
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
