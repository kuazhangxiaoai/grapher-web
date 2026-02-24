<template>
  <!--顶部导航栏-->
  <Header/>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import Header from "@/components/common/Header.vue";
onMounted(() => {
 
})



</script>
<style lang="scss">
#app {
  height: 100%;
}
</style>