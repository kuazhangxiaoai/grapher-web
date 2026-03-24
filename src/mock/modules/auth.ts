// 移除 MockMethod 导入，使用类型推断

export default [
  {
    url: '/serve_api/user/login',
    method: 'post',
    response: () => {
      // 直接返回成功的响应，忽略参数验证
      // 因为FormData格式的请求在mock插件中解析可能有问题
      return {
        code: 200,
        msg: '登录成功',
        data: {
          token: 'mock-token-' + Date.now(),
          userInfo: {
            id: 1,
            username: 'admin',
            nickname: '管理员',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            role: 'admin'
          }
        }
      }
    }
  },
  {
    url: '/serve_api/user/register',
    method: 'post',
    response: () => {
      return {
        code: 200,
        msg: '注册成功',
        data: {
          userId: Date.now()
        }
      }
    }
  },
  {
    url: '/serve_api/user/logout',
    method: 'post',
    response: () => {
      return {
        code: 200,
        msg: '退出成功'
      }
    }
  },
  {
    url: '/serve_api/user/getUserInfo',
    method: 'get',
    response: () => {
      return {
        code: 200,
        msg: '获取用户信息成功',
        data: {
          id: 1,
          username: 'admin',
          nickname: '管理员',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          role: 'admin',
          permissions: ['dashboard', 'users', 'roles', 'projects']
        }
      }
    }
  }
]
