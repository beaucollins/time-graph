import uuid from 'uuid/v4';
import { timeSpansOverlap, unionTimeSpanSet } from 'timespan';

export const splitBy = (fn, list) => {
	return list.reduce(([matching, others], item) => {
		if (fn(item)) {
			return [[item, ...matching], others];
		}
		return [matching, [item, ...others]];
	}, [[], []]);
};

const eachIndexInRange = (start, end, fn) => {
	const increment = start < end ? 1 : -1;
	let results = [];

	if (start === end) {
		return results.concat(fn(start));
	}
	let current = start;
	do {
		if (increment > 0 && current > end) {
			break;
		}
		if (increment < 0 && current < end) {
			break;
		}
		results = results.concat(fn(current));
		current += increment * 1;
	} while (true);
	return results;
};

export const applyGesture = (gesture, blocks) => {
	if (!gesture) {
		return blocks;
	}
	switch (gesture.type) {
		case 'multidraw':
			// the user is dragging the mouse from gesture.origin
			// to gesture.destination, fill in any possible blocks
			// blocks is the existing set of blocks, return only the
			// modifications?
			if (!gesture.destination) {
				return blocks;
			}
			// create the blocks that would fill the space for the gesture
			const gestured = eachIndexInRange(gesture.origin.row, gesture.destination.row, (row) => {
				return {
					row,
					startTime: gesture.origin.seconds,
					endTime: gesture.destination.seconds,
					gestured: true,
					uid: uuid(),
				};
			});
			const result = blocks.reduce(({ merged, potential }, block) => {
				// if any af the gusters match the block do something special?
				const [matching, others] = splitBy(maybe => block.row === maybe.row && timeSpansOverlap(block, maybe), potential);
				if (matching.length === 0) {
					return {
						merged: [...merged, block],
						potential: others,
					};
				}
				return {
					merged: merged,
					potential: [
						...others,
						{ ...block, ...unionTimeSpanSet([block, ...matching]), gestured: true },
					],
				};
			}, { merged: [], potential: gestured });
			return result.merged.concat(result.potential);
	}
	return blocks;
};
