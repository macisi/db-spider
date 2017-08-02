const $list = document.getElementById('J_List');
const $content = document.getElementById('J_Content');

fetch('/api/posts')
  .then(res => res.json())
  .then(res => {
    console.log(res);
    $list
      .innerHTML = res.content.map(postId => {
        return `<li><a href="#" data-id="${postId}">${postId}</a></li>`;
      }).join('');
  });

  $list.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'a') {
      e.preventDefault();
      const postId = e.target.dataset.id;
      fetch(`/api/post/${postId}`)
        .then(res => res.json())
        .then(res => {
          const content = res.content;
          $content.innerHTML = `
            <h1>${content.title}</h1>
            ${content.content}
          `;
        });
    }
  }, false);