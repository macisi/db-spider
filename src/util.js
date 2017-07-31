exports.randomBid = () => {
  return ('00000000000' +
    Math.floor(Math.random() * Math.pow(36, 11)).toString(36)).slice(-11).toUpperCase();
};
