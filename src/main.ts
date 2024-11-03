import './assets/css/mdui.min.css'
import './assets/js/mdui.min.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import router from './router'
import App from './App.vue'

// 导入elementPlus
// import elementPlus from 'element-plus'
// import 'element-plus/dist/index.css'

// import 'mdui/mdui.css'
// import 'mdui'

const app1 = createApp(App)

app1.use(createPinia())
app1.use(router)

app1.mount('#app')
