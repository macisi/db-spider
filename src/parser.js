/**
 * html parser
 */

exports.listParser = ($) => {
  const result = [];
  const $list = $('#content .article table.olt tr');
  
  $list.each((i, node) => {
    const url = $('.title a', node).attr('href');
    if (url) {
      result.push({
        url,
      });
    }
  });

  return Promise.resolve(result);
};

exports.postParser = ($, postId) => {
  const $authorNode = $('.topic-doc > h3 > .from > a');
  const authorId = $authorNode.attr('href').match(/people\/([a-zA-Z0-9]+)\//)[1];
  const title = $('#content > h1').text();
  const content = $('#link-report').html();

  return Promise.resolve({
    post: {
      id: postId,
      title,
      content,
    },
    userId: authorId,
  });
}

exports.userParser = ($) => {
  const uid = $('input[name="people"]').val();
  const $infoNode = $('#db-usr-profile');
  const userName = $infoNode.find('h1').text();
  const signature = $infoNode.find('.signature_display').text();
  const $profileNode = $('#user-intro');
  const intro = $profileNode.find('#intro_display').html();
  const avatar = $infoNode.find('.pic img').attr('src');
  const largeAvatar = $profileNode.find('.basic-info .userface').attr('src');

  return Promise.resolve(uid, {
    id: uid,
    userName,
    signature,
    intro,
    avatar,
    largeAvatar,
  });
}