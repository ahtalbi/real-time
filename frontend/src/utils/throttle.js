export function throttle(fn, wait = 500) {
	let isThrottled = false;

	return function throttled(...args) {
		if (isThrottled) return "functionne not executed ";

		isThrottled = true;
		fn(...args);

		setTimeout(() => {
			isThrottled = false;
		}, wait);
	};
}