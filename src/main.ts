import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import router from './router'
import App from './App.vue'
import elementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app1 = createApp(App)

app1.use(createPinia())
app1.use(router)
app1.use(elementPlus)

app1.mount('#app')
