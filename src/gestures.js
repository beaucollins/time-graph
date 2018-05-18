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

// assumes that splitting timespan is inside timespan
const splitTimeSpan = (timeSpan, splittingTimeSpan) => {
	return [
		{
			...timeSpan,
			startTime: timeSpan.startTime,
			endTime: splittingTimeSpan.startTime,
			uid: timeSpan.uid,
		},
		{
			...timeSpan,
			startTime: splittingTimeSpan.endTime,
			endTime: timeSpan.endTime,
			uid: uuid(),
		},
	];
};

const splitTimeSpans = (list, block) => {
	return list.reduce((all, blockToSplit) => {
		return [...all, ...splitTimeSpan(blockToSplit, block)];
	}, []);
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
				const invertTime = gesture.origin.seconds > gesture.destination.seconds;
				return {
					row,
					startTime: invertTime ? gesture.destination.seconds : gesture.origin.seconds,
					endTime: invertTime ? gesture.origin.seconds : gesture.destination.seconds,
					type: gesture.blockType,
					gestured: true,
					uid: uuid(),
				};
			});
			const result = blocks.reduce(({ merged, potential }, block) => {
				// if any af the gestures match the block do something special?
				const [matching, others] = splitBy(maybe => block.row === maybe.row &&
					timeSpansOverlap(block, maybe), potential);

				// nothing matches, lets go
				if (matching.length === 0) {
					return {
						merged: [...merged, block],
						potential: others,
					};
				}

				// now split matching gestures between those with the same type and those that don't have
				// the same type, they are alread in the same row and matching times
				const [matchingType, otherType] = splitBy(maybe => maybe.type === block.type, matching);

				return {
					merged: merged,
					potential: [
						// these were not in the same row or were not overlapping
						...others,
						// these are gestures in the same row with non-matching types
						// split these by removing `block`
						...(otherType.length > 0 ? splitTimeSpans(otherType, block) : []),
						// matching type gestures should be merged together
						matchingType.length > 0 ? { ...block, ...unionTimeSpanSet([block, ...matchingType]), gestured: true } : block,
					],
				};
			}, { merged: [], potential: gestured });
			return result.merged.concat(result.potential.filter(block => {
				return !block.gestured || block.endTime - block.startTime > 60 * 45;
			}));
	}
	return blocks;
};
