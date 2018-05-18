import uuid from 'uuid/v4';
import { timeSpansOverlap, unionTimeSpanSet } from 'timespan';
import splitBy from 'split-by';
import { matchType } from 'component/block-graph/with-gestures';

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

const mergeAndSplit = (generatedBlocks, existingBlocks) => {
	return existingBlocks.reduce(({ merged, potential }, block) => {
		// find all generated blocks in the same row as this block
		const [matching, others] = splitBy(maybe => block.row === maybe.row &&
			timeSpansOverlap(block, maybe), potential);

		// none of the potentially created blocks match any of the existing block
		// by row or timespan, add the block to our list and continue iterating
		if (matching.length === 0) {
			return {
				merged: [...merged, block],
				potential: others,
			};
		}

		// there new blocks in the same row and overlap in time. we need to determine
		// if the `block` can be merged with any of the generated blocks or if it should be used
		// to split the potentially created block

		// split the matching block between those that match type and those that do not
		const [matchingType, otherType] = splitBy(maybe => maybe.type === block.type, matching);

		return {
			// do not merge the existing block into the finished list because it will be modifying the
			// generated blocks in some fashion (either by merging with some or splitting them)
			merged,
			potential: [
				// these were not in the same row or were not overlapping
				...others,
				// these are gestures in the same row with non-matching types
				// split these by removing `block`s timespan from them
				...(otherType.length > 0 ? splitTimeSpans(otherType, block) : []),
				// matching type gestures should be merged together
				matchingType.length > 0 ? { ...block, ...unionTimeSpanSet([block, ...matchingType]), gestured: true } : block,
			],
		};
	}, { merged: [], potential: generatedBlocks });
};

const multidraw = (gesture, blocks) => {
	// the user is dragging the mouse from gesture.origin
	// to gesture.destination, fill in any possible blocks
	// blocks is the existing set of blocks, return only the
	// modifications?
	if (!gesture.destination) {
		return blocks;
	}
	// create the blocks that would fill the space for the gesture
	const generated = eachIndexInRange(gesture.origin.timeIndex.row, gesture.destination.timeIndex.row, (row) => {
		const invertTime = gesture.origin.timeIndex.seconds > gesture.destination.timeIndex.seconds;
		return {
			row,
			startTime: invertTime ? gesture.destination.timeIndex.seconds : gesture.origin.timeIndex.seconds,
			endTime: invertTime ? gesture.origin.timeIndex.seconds : gesture.destination.timeIndex.seconds,
			type: gesture.blockType,
			gestured: true,
			uid: uuid(),
		};
	});
	const result = mergeAndSplit(generated, blocks);
	return result.merged.concat(result.potential.filter(block => {
		return !block.gestured || block.endTime - block.startTime > 60 * 45;
	}));
};

const drag = (gesture, blocks) => {
	const timeDelta = (gesture.destination.timeIndex.seconds - gesture.origin.timeIndex.seconds);
	const block = gesture.block;
	const generated = {
		...block,
		gestured: true,
		endTime: gesture.dragMode === 'left' ? block.endTime : block.endTime + timeDelta,
		startTime: gesture.dragMode === 'right' ? block.startTime : block.startTime + timeDelta,
		row: gesture.dragMode === 'both' ? gesture.destination.timeIndex.row : block.row,
	};
	const result = mergeAndSplit([generated], blocks.filter(({ uid }) => uid !== block.uid));
	return result.merged.concat(result.potential.filter(b => {
		return !b.gestured || b.endTime - b.startTime >= 60 * 45;
	}));
};

export default matchType({
	multidraw, drag,
}, (_, blocks) => blocks);

