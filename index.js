const Crawler = require('crawler');
const chalk = require('chalk');
const seenreq = require('seenreq');

const { randomBid } = require('./src/util');
const DB = require('./src/db');
const seen = new seenreq({
  repo: 'redis',
  host: '127.0.0.1',
  port: 6379,
  clearOnQuit: false,
});

const { listParser, postParser, userParser } = require('./src/parser');

const PROXY_LIST = [
  '1.82.216.134:80',
  '101.53.101.172:9999',
  '111.155.124.77:8123',
  '113.200.156.53:9999',
  '113.200.159.155:9999',
  '113.89.180.249:9000',
  '114.230.216.14:28624',
  '114.55.237.39:3128',
  '115.231.175.68:8081',
  '115.29.2.139:80',
  '116.17.138.215:9797',
  '116.23.137.12:9999',
  '118.144.150.254:3128',
  '118.178.124.33:3128',
  '118.178.135.168:3128',
  '118.178.184.48:8080',
  '119.29.126.115:80',
  '119.36.77.130:9999',
  '120.26.167.174:3128',
  '120.26.168.190:3128',
  '120.26.168.194:3128',
  '120.26.168.236:3128',
  '120.26.168.80:3128',
  '120.36.213.133:40191',
  '121.199.7.34:3128',
  '121.199.9.36:3128',
  '121.204.165.189:8118',
  '121.32.251.43:80',
  '121.32.251.44:80',
  '121.32.251.45:80',
  '121.40.42.35:9999',
  '122.224.197.149:8080',
  '122.67.24.136:8080',
  '122.72.32.75:80',
  '123.138.73.122:9999',
  '123.139.56.234:9999',
  '123.206.219.186:3128',
  '123.207.143.51:8080',
  '123.234.219.133:8080',
  '123.7.115.141:9797',
  '123.7.38.31:9999',
  '124.234.157.196:80',
  '124.235.182.130:80',
  '124.88.67.13:80',
  '124.88.67.22:80',
  '124.88.67.23:80',
  '124.88.67.24:80',
  '124.88.67.34:80',
  '124.88.67.39:80',
  '124.88.67.54:80',
  '124.89.35.206:9999',
  '125.113.253.217:30024',
  '125.40.24.60:9797',
  '139.129.94.97:3128',
  '139.196.237.154:3128',
  '14.29.89.66:3128',
  '180.97.235.30:80',
  '183.45.88.15:9797',
  '202.202.90.20:8080',
  '211.81.31.18:8081',
  '218.198.88.206:8998',
  '218.56.132.155:8080',
  '218.56.132.156:8080',
  '218.66.147.43:29251',
  '219.145.244.250:3128',
  '220.249.185.178:9999',
  '221.1.201.142:9999',
  '221.204.101.129:9797',
  '221.204.103.195:9797',
  '221.204.103.26:9797',
  '221.204.11.8:8080',
  '221.216.94.77:808',
  '221.221.222.68:9999',
  '222.186.161.215:3128',
  '222.186.45.115:62222',
  '222.186.45.19:63334',
  '222.187.227.40:10000',
  '27.159.124.84:8118',
  '27.205.93.33:9999',
  '27.46.74.38:9999',
  '27.46.74.39:9999',
  '42.184.125.89:8118',
  '58.215.162.12:3128',
  '58.243.0.162:9999',
  '58.59.68.91:9797',
  '59.40.71.210:9797',
  '60.191.106.109:9999',
  '61.143.60.226:3128',
  '61.152.81.193:9100',
  '61.155.184.47:8081',
  '61.163.39.70:9999',
  '61.191.41.130:80',
  '61.232.254.39:3128',
];
const UA =
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
  ];
const groupId = 'haixiuzu';
const PAGE_STEP = 25;
const MAX_POSTS = 100;
const REQ_CONFIG = {
  headers: {
    Cookie: `bid=${randomBid()}`,
  },
  proxy: 'http://120.199.224.78:80',
};

const db = new DB();

const c = new Crawler({
  rateLimit: 2000,  
  async callback(err, res, done) {
    if (err) {
      console.log(chalk.red(err));
    } else {
      if (res.statusCode === 200) {
        switch (res.options.from) {
          case 'list':
          default:
            try {
              const result = await listParser(res.$);
              result.forEach(d => {
                c.queue(
                  Object.assign({}, REQ_CONFIG, {
                    uri: d.url,
                    from: 'post',
                  })
                );
              });
            } catch (e) {
              console.log(chalk.red(e));
            }
            done();
            break;
          case 'post':
            const postId = res.options.uri.match(/topic\/(\d+)\//)[1];
            try {
              const { userId, post } = await postParser(res.$, postId);
              const userUrl = `https://www.douban.com/people/${userId}/`;
              seen.exists(userUrl, {
                callback(error, result) {
                  if (error) {
                    console.log(chalk.red(error));
                  } else {
                    if (!result) {
                      c.queue(
                        Object.assign({}, REQ_CONFIG, {
                          uri: userUrl,
                          from: 'user',
                        })
                      );
                    }
                  }
                  db.insertPostToGroup(groupId, post.id);
                  db.setPost(post.id, post);
                  done();
                },
              });
            } catch (e) {
              console.log(chalk.red(e));
            }
            break;
          case 'user':
            try {
              const { uid, userInfo } = await userParser(res.$);
              db.setUser(uid, userInfo);
            } catch (e) {
              console.log(chalk.red(e));
            }
            done();
            break;

            done();
        }
      } else {
        console.log(`${chalk.red('error:')}: ${res.statusCode}`);
        done();
      }
    }
  },
  rotateUA: true,
  userAgent: UA,
});

c.on('request', options => {
  const t = new Date();
  console.log(
    `${chalk.green(t.toLocaleString())}: from ${chalk.cyan(
      options.from
    )} uri ${chalk.yellow(options.uri)}`
  );
});

let start = 0;
c.on('drain', () => {
  const t = new Date();
  console.log(`${chalk.green(t.toLocaleString())}: page done`);
  if (start < MAX_POSTS) {
    start += PAGE_STEP;
    console.log(
      `${chalk.green(t.toLocaleString())}: next page: ${chalk.yellow(start)}`
    );
    run(start);
  } else {
    console.log(
      `${chalk.green(t.toLocaleString())}: reach last page ${chalk.red(
        'stopped'
      )}!`
    );
  }
});

const run = start => {
  c.queue(
    Object.assign({}, REQ_CONFIG, {
      uri: `https://www.douban.com/group/${groupId}/discussion?start=${start}`,
      from: 'list',
    })
  );
};

run(start);
