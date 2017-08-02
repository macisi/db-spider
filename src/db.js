const Redis = require('ioredis');

class DB {
  constructor() {
    const redis = this.redis = new Redis({
      port: 6379,
      host: '127.0.0.1',
      family: 4,
      db: 0,
      dropBufferSupport: true,
    });
  }
  static flattenObj(obj) {
    return Object.entries(obj)
      .reduce((prev, cur) => prev.concat(cur), []);
  }
  getUser(uid) {
    return this.redis.hmget(`user:${uid}`);
  }
  getPost(postId) {
    return new Promise(resolve => {
      this.redis.hgetall(`post:${postId}`, (err, res) => {
        resolve(res);
      });
    })
  }
  setUser(uid, userInfo) {
    console.log(uid, DB.flattenObj(userInfo));
    return;
    this.redis.hmset(`user:${uid}`, ...DB.flattenObj(userInfo));
  }
  setPost(postId, postInfo) {
    this.redis.hmset(`post:${postId}`, ...DB.flattenObj(postInfo));
  }
  insertPostToGroup(groupName, postId) {
    this.redis.sadd(groupName, postId);
  }
  getPostByGroup(groupName) {
    return new Promise((resolve) => {
      this.redis.sinter(groupName, (err, res) => {
        resolve(res);
      });
    })
  }
};

module.exports = DB;
