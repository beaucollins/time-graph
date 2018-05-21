/**
 * Given a function that evaluates an item in the list and returns true or fale, splits the
 * list into two lists and returns the two lists.
 *
 * @param {Function} fn - of type (item) => boolean that is called with each item in the list
 * @param {Array<any>} list - a list of things
 * @returns {Array<Array<any>>} a list of two lists, the first that fn returns true against
 */
export default (fn, list) => {
	return list.reduce(([matching, others], item) => {
		if (fn(item)) {
			return [[item, ...matching], others];
		}
		return [matching, [item, ...others]];
	}, [[], []]);
};
