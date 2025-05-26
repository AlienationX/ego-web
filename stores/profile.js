import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia'; //从pinia中导入，defineStore方法，用于定义一个新的store

// import { reqGitHubUser } from '@/api/github.js';
// import { setToken, removeToken } from '@/common/auth.js';
// import { routes } from '@/router/routes.js'; // TODO 从接口获取，临时使用

export const useProfileStore = defineStore(
    'profile',
    () => {
        const token = ref('');
        const userinfo = reactive({});
        const privilege = reactive({
            routes: [],
            disable: [], // 按钮权限的控制，禁用(隐藏)的按钮。为空即为拥有全部按钮权限
        });
        const message = ref('');
        const showAd = ref(true);
        
        // 记录本次使用的下载次数
        const downloadCnt = ref(0);
        const downloadCntAdd = () => {
          downloadCnt.value++
          console.log("已下载次数", downloadCnt.value);
        }

        async function getUserInfo() {
            
            let result = await reqGitHubUser(token.value);

            // TODO 判断 登录成功 or 用户名密码错误 or 网络请求错误
            if (result.code && result.code === 200) {
                // 1.登录成功返回 code data message 数据
                Object.assign(userinfo, result.data); // 只能使用该方式修改对象的值不会丢失响应式。
                userinfo.username = userinfo.login; // github的接口没有username，赋值login。
                // message = '登录成功！';
            } else if (result.response && result.response.status && result.response.status === 404) {
                // 2.用户名密码错误
                message.value = result.response.statusText + ', ' + result.message;
                message.value = '用户名和密码错误，请重新输入!';
            } else if (result.response && result.response.status && result.response.status === 403) {
                // 3.接口错误
                // code: "ERR_BAD_REQUEST"
                // message: "Request failed with status code 403"
                message.value = result.code + ', ' + result.message;
            } else {
                // 4.网络请求错误
                // code: "ERR_NETWORK"
                // message: ""Network Error""
                message.value = result.code + ', ' + result.message;
                // message.value = '网络问题，请检查网络是否正常连接！';
                message.value = '服务器问题，请联系管理员处理！';  // 一般是接口请求问题
            }

            message.value && console.log(message.value);
        }

        async function getPrivilege() {
            // TODO 根据token获取用户菜单和禁用的按钮权限
            let result = await reqGitHubUser(token.value);
            privilege.routes = routes;
            privilege.disable = [];
        }

        async function login(username, password) {
            //  每次登陆重置token
            // TODO 接口请求，通过username和password获取token
            token.value = username;

            await getUserInfo(); // TODO use github user test
            await getPrivilege();

            // TODO 只有登录成功才会把token存储本地或其他地方，比如cookie，方便下次使用
            // 暂时使用方法存储和读取token
            if (userinfo.id) {
                setToken(token.value);
            }
        }

        // store重置，数据还原成默认值
        function logout() {
            token.value = '';

            // info = {}  // 无效
            // info = reactive({})  // 无效
            // Object.assign(info, {});  // 该方式只能覆盖已有key的value，主要用于对象的合并

            // for (const k in info) {
            //     delete info[k];
            // }
            Object.keys(userinfo).forEach((key) => delete userinfo[key]);

            // menuRoutes = reactive([]);  // 无效
            // menuRoutes.splice(0);  // 清空数组
            // menuRoutes.length = 0;  // 清空数组
            // routes.push(...routes)  // 列表追加列表
            privilege.routes = [];
            privilege.disable = [];

            removeToken();
        }

        return { token, userinfo, privilege, message, showAd, downloadCnt, downloadCntAdd, getUserInfo, getPrivilege, login, logout };
    }
    // {
    //     persist: {
    //         // 存储的 key， 默认是 defineStore 的第一个参数
    //         // key: "A",
    //         // 存储位置，默认 localStorage，还支持sessionStorage，cookie比较复杂
    //         // storage: localStorage,
    //         // 指定存储的内容
    //         paths: ['token'],
    //     },
    // }
);