export default (fn, list) => {
	return list.reduce(([matching, others], item) => {
		if (fn(item)) {
			return [[item, ...matching], others];
		}
		return [matching, [item, ...others]];
	}, [[], []]);
};
