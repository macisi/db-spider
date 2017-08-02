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
                },
              });
            } catch (e) {
              console.log(chalk.red(e));
            }
            done();
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
