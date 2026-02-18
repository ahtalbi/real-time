import { initCreatePost } from "./utils/home_createPost.js";
import { initCreateComment, initToggleComments } from "./utils/home_comments.js";
import { initReactions } from "./utils/home_reactions.js";
import { initFetchUsers } from "./utils/home_fetchUsers.js";
import { initLogoutMenu } from "./utils/home_initLogout.js";
import { initSetUserData } from "./utils/home_setUserData.js";
import { ClientRouter } from "../../router.js";
import { GlobalEventsManager } from "../../events/init.js";
import { initPostsFetchObserver } from "./utils/home_fetchPosts.js";

function initMessagesShortcut() {
	GlobalEventsManager.click.RegisterEvent("messagesBtn", () => { ClientRouter.navigate("/messages") });
	GlobalEventsManager.click.RegisterEvent("messagesFab", () => { ClientRouter.navigate("/messages") });
	GlobalEventsManager.click.RegisterEvent("messageUserBtn", (ele) => {
		const userId = ele.getAttribute("userid");
		const nickname = ele.getAttribute("username");
		if (!userId) {
			ClientRouter.navigate("/messages");
			return;
		}
		const query = new URLSearchParams({ to: userId, name: nickname || "" });
		ClientRouter.navigate(`/messages?${query.toString()}`);
	});
}

function initHome() {
	initSetUserData();
	initCreatePost();
	initCreateComment();
	initToggleComments();
	initReactions();
	initLogoutMenu();
	initMessagesShortcut();
	initFetchUsers();
	initPostsFetchObserver();
	document.getElementById("logo").addEventListener("click", () => { ClientRouter.navigate("/") });
}

initHome();
