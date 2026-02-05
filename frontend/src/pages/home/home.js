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
}

initHome();