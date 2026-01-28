import { showAlert } from "../../../src/utils/alert.js";

let stateUsers = {
  offset: 0,
  loading: false,
  hasMore: true,
};

const PAGE_SIZE = 100;

function getUserDisplayName(user) {
  if (!user) return "Unknown";
  let nickname = user.nickname || user.Nickname || "";
  if (nickname) return nickname;

  let firstname = user.firstname || user.Firstname || "";
  let lastname = user.lastname || user.Lastname || "";
  let fullName = `${firstname} ${lastname}`.trim();
  if (fullName) return fullName;

  return user.email || user.Email || "Unknown";
}

function getUserId(user) {
  if (!user) return "";
  return user.id || user.ID || "";
}

function getUserEmail(user) {
  if (!user) return "";
  return user.email || user.Email || "";
}

function appendUsersToList(list, users) {
  if (!list) return;
  let frag = document.createDocumentFragment();
  let withMessageBtn = list.dataset.friendsActions === "message";

  users.forEach((user) => {
    let li = document.createElement("li");
    let userId = getUserId(user);
    let name = getUserDisplayName(user);
    let email = getUserEmail(user);
    li.dataset.userId = userId;
    li.dataset.userName = name;

    if (withMessageBtn) {
      li.className = "thread";

      let meta = document.createElement("div");
      meta.className = "meta";

      let nameEl = document.createElement("span");
      nameEl.className = "name";
      nameEl.textContent = name;

      let preview = document.createElement("span");
      preview.className = "preview";
      preview.textContent = email || "Start a conversation";

      meta.appendChild(nameEl);
      meta.appendChild(preview);

      li.appendChild(meta);
    } else {
      li.className = "row-between";

      let label = document.createElement("span");
      let dot = document.createElement("span");
      dot.className = "dot";
      label.appendChild(dot);
      label.append(` ${name}`);

      li.appendChild(label);

    }

    frag.appendChild(li);
  });

  list.appendChild(frag);
}

async function fetchUsers(btn, lists) {
  if (stateUsers.loading || !stateUsers.hasMore) return;

  stateUsers.loading = true;
  if (btn) btn.disabled = true;

  let res;
  try {
    res = await fetch("http://localhost:3000/getusers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startID: stateUsers.offset }),
    });
  } catch {
    showAlert("Failed to fetch users");
    stateUsers.loading = false;
    if (btn) btn.disabled = false;
    return;
  }

  let data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    if (data && data.error && data.error.includes("startID reached")) {
      stateUsers.hasMore = false;
      if (btn) btn.remove();
    } else {
      showAlert("Failed to fetch users");
      if (btn) btn.disabled = false;
    }
    stateUsers.loading = false;
    return;
  }

  if (data.error) {
    if (!data.error.includes("startID reached")) {
      showAlert(data.error);
    }
    stateUsers.hasMore = false;
    stateUsers.loading = false;
    if (btn) btn.remove();
    return;
  }

  let users = Array.isArray(data.data) ? data.data : [];
  lists.forEach((list) => appendUsersToList(list, users));

  if (users.length < PAGE_SIZE) {
    if (btn) btn.remove();
    stateUsers.hasMore = false;
  } else {
    stateUsers.offset += PAGE_SIZE;
  }

  stateUsers.loading = false;
  if (btn) btn.disabled = false;
}

export function initFetchUsers() {
  const lists = Array.from(document.querySelectorAll("[data-friends-list]"));
  if (!lists.length) return;

  stateUsers.offset = 0;
  stateUsers.loading = false;
  stateUsers.hasMore = true;
  lists.forEach((list) => (list.innerHTML = ""));

  const btn = document.querySelector("button[data-see-more-users]");
  if (btn) {
    btn.addEventListener("click", () => fetchUsers(btn, lists));
  }

  fetchUsers(btn, lists);
}
