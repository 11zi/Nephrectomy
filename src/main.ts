import './assets/css/mdui.min.css'
import './assets/js/mdui.min.js'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import router from './router'
import App from './App.vue'

const Nephrectomy = createApp(App)

Nephrectomy.use(createPinia())
Nephrectomy.use(router)

Nephrectomy.mount('#app')
