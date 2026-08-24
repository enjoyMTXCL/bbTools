import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import Layout from "./components/layout.vue";

import 'element-plus/theme-chalk/display.css'
import "element-plus/theme-chalk/src/message.scss"
import "element-plus/theme-chalk/src/message-box.scss"
import "element-plus/theme-chalk/src/overlay.scss"
import "element-plus/theme-chalk/src/loading.scss"
import 'element-plus/theme-chalk/dark/css-vars.css'

import { useDark } from '@vueuse/core'

useDark()

const app = createApp(App)

app.use(createPinia());
app.use(router)

app.component('Layout', Layout).mount('#app')