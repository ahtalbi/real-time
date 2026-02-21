export const reactionEmojiByType = {
  0: "👍",
  1: "🇩🇿",
  2: "😂",
  3: "😮",
  4: "😢",
  5: "😡",
  6: "❤️",
};

export function escapeHTML(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function postTemplate(p) {

  p.CategoryType = p.CategoryType.replace(/,/g, ", ");
  const reactionsTotal = Number.isInteger(p.NbrOfReactions) ? p.NbrOfReactions : 0;
  const userReaction = Number.isInteger(p.UserReaction) ? p.UserReaction : -1;
  const mainEmoji = reactionEmojiByType[userReaction] || "👍";
  const selectedClass = userReaction >= 0 ? " is-selected" : "";

  return `
  <article class="post card" id="${escapeHTML(p.ID)}">
    <header class="post-head">
      <div class="avatar sm" aria-hidden="true"></div>
      <div>
        <h3 class="post-title">${escapeHTML(p.AutherName)}</h3>
        <h1 class="muted">${escapeHTML(p.CategoryType)}</h1>
        <p class="muted">${escapeHTML(p.CreatedAt)}</p>
      </div>
    </header>
  
    <p class="post-body">${escapeHTML(p.Content)}</p>
    ${p.ImageURL
      ? `<figure class="post-media">
            <img src="${escapeHTML(p.ImageURL || "")}" />
          </figure>`
      : ""
    }
    
    <footer class="post-foot">
      <div class="reactions"
           aria-label="Reactions"
           data-reaction-scope="POST"
           data-reaction-id="${escapeHTML(p.ID)}"
           data-default-emoji="👍">
        <button class="btn reaction-btn${selectedClass}" type="button" data-reaction-toggle>
          ${escapeHTML(mainEmoji)}
        </button>
        <div class="reaction-menu">
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="0">👍</button>
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="1">🇩🇿</button>
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="2">😂</button>
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="3">😮</button>
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="4">😢</button>
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="5">😡</button>
          <button class="btn reaction-option" type="button" id="reaction-option" data-reaction-type="6">❤️</button>
        </div>
        <span class="reaction-total">${escapeHTML(String(reactionsTotal))}</span>
      </div>
    
      <button class="btn" id="toggle-comments-btn" type="button">
        💬 
        <span id="comments-count-${escapeHTML(p.ID)}" style="pointer-events:none;">
          ${escapeHTML(String(p?.NbrOfComments))}
        </span>
      </button>
    </footer>
    
    <section class="comments is-hidden"
             id="comments-box-${escapeHTML(p.ID)}"
             aria-label="Comments">
      <div class="comments-head row-between">
        <h4 class="comments-title">Comments</h4>
        <button class="btn ghost sm" id="close-comments-btn" type="button">Close</button>
      </div>
    
      <form class="comment-create" id="comment-form">
        <div class="row">
          <input type="hidden" name="PostId" value="${escapeHTML(p.ID)}" />
          <div class="avatar xs" aria-hidden="true"></div>
          <input class="input"
                 name="comment"
                 type="text"
                 placeholder="Write a comment..."
                 required />
          <button class="btn primary sm" type="submit">Send</button>
        </div>
      </form>
    
      <ul class="comments-list" id="comments-list-${escapeHTML(p.ID)}">
        ${p.Comments.map(commentTemplate).join("")}
      </ul>
    
      <button class="btn ghost sm" id="see-more-comments-btn" type="button">
        See More...
      </button>
    </section>
  </article>
  `;

}

export function commentTemplate(c) {
  const reactionsTotal = Number.isInteger(c.NbrOfReactions)
    ? c.NbrOfReactions
    : 0;
  const userReaction = Number.isInteger(c.UserReaction) ? c.UserReaction : -1;
  const mainEmoji = reactionEmojiByType[userReaction] || "👍";
  const selectedClass = userReaction >= 0 ? " is-selected" : "";

  return `<li class="comment">
  <div class="avatar xs" aria-hidden="true"></div>
  <div class="comment-body">
    <div class="row-between">
      <strong class="comment-author">${c.AutherName}</strong>
      <span class="muted comment-time">${c.CreatedAt}</span>
    </div>
    <p class="comment-text">${c.Content}</p>
    <div class="comment-actions">
      <div class="reactions" aria-label="Comment reactions" data-reaction-scope="COMMENT" data-reaction-id="${c.ID}" data-default-emoji="👍">
        <button class="btn reaction-btn xs${selectedClass}" type="button" data-reaction-toggle>${mainEmoji}</button>
        <div class="reaction-menu">
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="0">👍</button>
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="1">🇩🇿</button>
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="2">😂</button>
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="3">😮</button>
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="4">😢</button>
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="5">😡</button>
          <button class="btn reaction-option xs" id="reaction-option" type="button" data-reaction-type="6">❤️</button>
        </div>
        <span class="reaction-total">${reactionsTotal}</span>
      </div>
    </div>
  </div>
</li>`;
}

