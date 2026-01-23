export function postTemplate(post) {
  return `
<article class="post card">
  <header class="post-head">
    <div class="avatar sm" aria-hidden="true"></div>
    <div>
      <h3 class="post-title">${post.AutherName}</h3>
      <p class="muted">${post.CreatedAt}</p>
    </div>
  </header>

  <p class="post-body">${post.Content}</p>

  <footer class="post-foot">
    <button class="btn" type="button">👍 ${post.NbrOfLikes}</button>
    <button class="btn" type="button" data-toggle-comments>💬 ${post.Comments.length}</button>
    <button class="btn" type="button">👎 ${post.NbrOfDislikes}</button>
  </footer>

  <section class="comments is-hidden" aria-label="Comments">
    <div class="comments-head row-between">
      <h4 class="comments-title">Comments</h4>
      <button class="btn ghost sm" type="button" data-close-comments>Close</button>
    </div>

    <form class="comment-create" data-comment-form>
      <div class="row">
        <input type="hidden" name="PostId" value="${post.ID}" />
        <div class="avatar xs" aria-hidden="true"></div>
        <input class="input" name="comment" type="text" placeholder="Write a comment..." required />
        <button class="btn primary sm" type="submit">Send</button>
      </div>
    </form>

    <ul class="comments-list">
      ${post.Comments.map(commentTemplate).join("")}
    </ul>
  </section>
</article>`;
}

export function commentTemplate(c) {
  return `
<li class="comment">
  <div class="avatar xs" aria-hidden="true"></div>
  <div class="comment-body">
    <div class="row-between">
      <strong class="comment-author">${c.UserID}</strong>
      <span class="muted comment-time">${c.CreatedAt}</span>
    </div>
    <p class="comment-text">${c.Content}</p>
  </div>
</li>`;
}
