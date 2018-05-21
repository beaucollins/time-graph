import uuid from 'uuid/v4';
import { timeSpansOverlap, unionTimeSpanSet } from 'timespan';
import splitBy from 'split-by';
import { matchType } from 'component/block-graph/with-gestures';

/**
 * Given a start and end figures out all integers that exist in that range and
 * call the fn callback with the number. Collects and concats the results into
 * a single list.
 *
 * Will iterate either direction, so start can be greater than end.
 *
 * Example:
 *   const results = eachIndexInRange(0, 10, (index) => {
 *     // return a list of results matching this index
 *     if (index > 3 && index < 5) {
 *       return [{ key: 'value', index }];
 *     }
 *     return [ index * 2 ];
 *   });
 *
 *   console.log(results); // => [0, 2, 4, {key: 'value', index: 3}, 8, {key: 'value', ...}]
 *
 * @param {number} start - the beginning index
 * @param {number} end - the ending index
 * @param {Function} fn - the callback of (number) => Array<>
 * @returns {Array} a list of the results for each number in the index
 */
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
	return existingBlocks.reduce(({ unchanged, modified, deleted }, block) => {
		// find all generated blocks in the same row as this block
		const [matching, others] = splitBy(maybe => block.row === maybe.row &&
			timeSpansOverlap(block, maybe), modified);

		// none of the potentially created blocks match any of the existing block
		// by row or timespan, add the block to our list and continue iterating
		if (matching.length === 0) {
			return {
				unchanged: [...unchanged, block],
				modified: others,
				deleted,
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
			unchanged,
			deleted,
			modified: [
				// these were not in the same row or were not overlapping
				...others,
				// these are gestures in the same row with non-matching types
				// split these by removing `block`s timespan from them
				...(otherType.length > 0 ? splitTimeSpans(otherType, block) : []),
				// matching type gestures should be merged together
				// TODO: there's a potential to cause blocks to be deleted, need those tracked
				// for gesture results
				matchingType.length > 0
					? { ...block, ...unionTimeSpanSet([block, ...matchingType]), gestured: true }
					: block,
			],
		};
	}, { unchanged: [], modified: generatedBlocks, deleted: [] });
};

const multidraw = (gesture, blocks) => {
	// the user is dragging the mouse from gesture.origin
	// to gesture.destination, fill in any possible blocks
	// blocks is the existing set of blocks, return only the
	// modifications?
	if (!gesture.destination) {
		return { unchanged: blocks };
	}
	// create the blocks that would fill the space for the gesture
	const { destination, origin } = gesture;
	const rows = {};
	const generated = eachIndexInRange(origin.timeIndex.row, destination.timeIndex.row, (row) => {
		rows[row] = true;
		const invertTime = origin.timeIndex.seconds > destination.timeIndex.seconds;
		return {
			row,
			startTime: invertTime ? destination.timeIndex.seconds : origin.timeIndex.seconds,
			endTime: invertTime ? origin.timeIndex.seconds : destination.timeIndex.seconds,
			type: gesture.blockType,
			gestured: true,
			uid: uuid(),
		};
	});
	// we only need to consider blocks in the same rows, slpit them out
	const [matchingRow, other] = splitBy(block => rows[block.row] === true, blocks);
	const result = mergeAndSplit(generated, matchingRow);
	return {
		...result,
		unchanged: [...result.unchanged, ...other],
		modified: result.modified.filter(block => {
			return !block.gestured || block.endTime - block.startTime >= 60 * 45;
		}),
	};
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
	return { ... result, modified: result.modified.filter(b => {
		return !b.gestured || b.endTime - b.startTime >= 60 * 45;
	}) };
};

export default matchType({
	multidraw, drag,
}, (_, blocks) => ({ unchanged: blocks, modified: [], deleted: [] }));

