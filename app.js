const path = require('path')
const express = require('express')
const router = require('./router')
const app = express()
const ejs = require('ejs')

//静态资源服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')))
app.use('/libs', express.static(path.join(__dirname, 'libs')))
app.use('/common', express.static(path.join(__dirname, 'common')))

//配置模板引擎
app.set('views', path.join(__dirname, 'views'))

//配置html引擎
app.engine('.html', ejs.renderFile);

//配置视图引擎
app.set('view engine', 'html')

//加载路由系统
app.use(router)

app.listen(3000, () => {
    console.log('server is running at port 3000.');
})
