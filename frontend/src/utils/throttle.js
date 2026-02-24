export function throttle(fn, wait = 1000) {
	let isThrottled = false;

	return function throttled(...args) {
		if (isThrottled) return;

		isThrottled = true;
		fn.apply(this, args);

		setTimeout(() => {
			isThrottled = false;
		}, wait);
	};
}
