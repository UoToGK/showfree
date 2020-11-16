const Koa = require('koa');
const path = require('path');
const views = require('koa-views');
const phantom = require('phantom');
const uuid = require('uuid');
const fs = require('fs');
const static = require('koa-static');
const body = require('koa-body');
const app = new Koa();
app.use(body()); //解析body中间件
app.use(views(path.join(__dirname, './'), { //设置模板引擎
    extension: 'ejs'
}))
app.use(static(path.join(__dirname, './'))); //配置静态服务器
app.use(async (ctx, next) => {
    const url = ctx.url;
    if (url === '/index' || url == '') {
        const data = ctx.request.body; //获取请求的参数
        await ctx.render('index', data) //渲染
    }
    await next();
})
// app.use(async (ctx, next) => { //获取pdf
//     const url = ctx.url;
//     if (url === '/getpdf') {
//         const data = await transformPdf();
//         ctx.set({
//             'Content-Type': 'application/pdf'
//         })
//         ctx.body = fs.createReadStream(data.data.file); //返回pdf
//     }
// })
app.listen(8888); //监听端口
async function transformPdf() {
    let ph = await phantom.create();
    let page = await ph.createPage();
    var settings = { //设置请求相关的配置
        operation: "POST",
        encoding: "utf8",
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify({ name: "转pdf啦！！！" }) //请求主体
    };
    reportpath = "http://localhost:8080/html2pdf"; // 本地文件中注册的路由
    let status = await page.open(reportpath, settings); // 打开ejs模板的页面
    if (status == "success") {
        let filename = path.join(__dirname, 'pdf', uuid.v4() + '.pdf'); // 临时文件的下载目的路径
        page.property('viewportSize', { width: 600, height: 600 }); //设置pdf的页面大小
        page.property('paperSize', { //设置页面相关的属性
            format: 'A4',
            margin: {
                top: '30px'
            },
            footer: {
                height: "30px",
                contents: ph.callback(function (pageNum, numPages) {
                    return "<div align='center'><span>P." + pageNum + " of " + numPages + "</span></div>";
                })
            }
        });
        await page.render(filename); // 将html转换为pdf 并且保存到当前filename设置的目录下
        ph.exit();
        return { code: 0, msg: '', data: { file: filename } };
    } else {
        return { code: code.wrong_parameter, msg: 'params error', data: {} };
    }
}