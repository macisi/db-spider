const chalk = require('chalk');
const Koa = require('koa');
const app = new Koa();
const json = require('koa-json')
const Router = require('koa-better-router');
const serve = require('koa-better-serve');
const DB = require('../src/db');

const db = new DB();

const router = Router();
const apiRouter = Router({
  prefix: '/api',
});

router.addRoute('GET', '/', (ctx, next) => {
  ctx.body = `Hello world! Prefix: ${ctx.route.prefix}`
  return next()
});

apiRouter.addRoute('GET', '/posts',  async (ctx, next) => {
  const posts = await db.getPostByGroup('haixiuzu');
  ctx.body = {
    content: posts,
  };
});
apiRouter.addRoute('GET', '/post/:id', async (ctx, next) => {
  const post = await db.getPost(ctx.params.id);
  ctx.body = {
    content: post,
  };
});
apiRouter.extend(router);

apiRouter.getRoutes().forEach(route => console.log(route.path));

app.use(apiRouter.middleware());
app.use(serve('./public', '/'));
app.use(json());
app.use(async (ctx, next) => {
  ctx.req.referer = 'https://www.douban.com';
  await next();
});

app.listen(3000, function(){
  console.log(`server started in port ${chalk.green(3000)}`);
});