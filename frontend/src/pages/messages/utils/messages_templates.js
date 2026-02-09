import { GlobalEventsManager } from "../../../events/init.js";

export function UserTemplate(User) {
	const tpl = document.createElement("template");
	tpl.innerHTML = `<li class="row-between" userid="${User.ID}" username="${User.Nickname}">
    	<span>${User.Nickname}</span>
		<button class="btn sm" id="messageUserBtn-${User.ID}" type="button" userid="${User.ID}" username="${User.Nickname}">Message</button>
	</li>`;

	let el = tpl.content.firstElementChild;

	GlobalEventsManager.click.RegisterEvent(`messageUserBtn-${User.ID}`, () => {
		console.log(User);
	})
	
	return el;
}
