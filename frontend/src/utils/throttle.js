// this is throttle function we make it to stop too much actions on some function
export function throttle(fn, wait = 500) {
	let isThrottled = false;

	return function throttled(...args) {
		if (isThrottled) return "functionne not executed";

		isThrottled = true;
		fn(...args);

		setTimeout(() => {
			isThrottled = false;
		}, wait);
	};
}