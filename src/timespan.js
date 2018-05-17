/** @format */

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * 60;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24;

/**
 * Represents a single range of time with a start and beginning. Makes no assumption of which unit
 * of time is used (seconds vs milliseconds vs minutes). Assumes startTime and endTime are in the
 * same unit.
 *
 * @format
 * @typedef {Object} TimeSpan - represents a time range
 * @property {number} startTime - the beginning of the time range
 * @property {number} endTime - the end of the time range
 */

/**
 * Checks if timestamp is within the container timespan. Assumes both are in the
 * same units.
 *
 * @param {TimeSpan} container - TimeSpan of unspecified units (seconds vs hours vs whatever)
 * @param {number} timestamp - a timestamp in the same units as container
 * @returns {boolean} true if timestamp is within the container timespan
 */
export const timeSpanContainsTime = (container, timestamp) => {
	return timestamp >= container.startTime && timestamp <= container.endTime;
};

/**
 * Compares if timespans are the same
 * @param {TimeSpan} a - timespan to compare
 * @param {TimeSpan} b - timespan to compare
 * @returns {boolean} true if start time and end time are equal
 */
export const timeSpansAreEqual = (a, b) => {
	if (!a || !b) {
		return false;
	}
	return a.startTime === b.startTime && a.endTime === b.endTime;
};

/**
 * Returns `true` if timespan fits completely within container
 *
 * @param {TimeSpan} container - the timespan container
 * @param {TimeSpan} timespan - timespan being placed in container timespan
 * @returns {boolean} true if timespan fits in container TimeSpan
 */
export const timeSpanContainsTimeSpan = (container, timespan) => {
	return timespan.startTime >= container.startTime && timespan.endTime <= container.endTime;
};

/**
 * Returns `true` if spans overlap or are adjacent to eachother
 *
 * @param {TimeSpan} a - TimeSpan
 * @param {TimeSpan} b - TimeSpan
 * @returns {boolean} true if spans overlap or are exactly adjacent
 */
export const timeSpansOverlap = (a, b) => {
	// adjacent a | b
	if (a.startTime === b.endTime) {
		return true;
	}

	// adjacent b | a
	if (a.endTime === b.startTime) {
		return true;
	}

	if (a.startTime < b.endTime && a.endTime > b.startTime) {
		return true;
	}

	return false;
};

/**
 * Combines two timespan into one timespan that contains both
 *
 * @param {TimeSpan} a - first TimeSpan
 * @param {TimeSpan} b - second TimeSpan
 * @returns {TimeSpan} the smallest continous TimeSpan that contains both
 */
export const mergeTimeSpans = (a, b) => {
	return {
		startTime: Math.min(a.startTime, b.startTime),
		endTime: Math.max(a.endTime, b.endTime),
	};
};

/**
 * @param {TimeSpan[]} timespans - set of timespans
 * @returns {TimeSpan[]} timespans with any overlapping times merged
 */
export const mergeTimeRangeSet = timespans => {
	// when 0 or 1 items return it, nothing left we can do
	if (timespans.length <= 1) {
		return timespans;
	}

	const mergeWithSpans = ({ current, combined }, span) => {
		// no span marked is current, so this span will be considered
		// current and the combined spans will be empty
		if (!current) {
			return { current: span, combined };
		}

		// if the span and current overlap, merge them together and use as current
		if (timeSpansOverlap(current, span)) {
			return { current: mergeTimeSpans(current, span), combined };
		}

		// current and span do not overlap, push current to combined
		// and span becomes current
		return { current: span, combined: combined.concat([current]) };
	};

	const { current: span, combined } = timespans.reduce(mergeWithSpans, {
		current: null,
		combined: [],
	});
	return combined.concat([span]);
};

/**
 * Return the timespan that encompasses all of the timespans in the given set.
 *
 * @param {TimeSpan[]} timespans - unordered list of timespans
 * @returns {TimeSpan} the timespan that includes all of the given timespans
 */
export const unionTimeSpanSet = timespans => {
	if (!timespans || timespans.length === 0) {
		return { startTime: -Infinity, endTime: Infinity };
	}
	if (timespans.length === 1) {
		return timespans[0];
	}
	const [head, ...rest] = timespans;
	return rest.reduce((union, timespan) => {
		return {
			startTime: timespan.startTime < union.startTime ? timespan.startTime : union.startTime,
			endTime: timespan.endTime > union.endTime ? timespan.endTime : union.endTime,
		};
	}, head);
};

/**
 * Invert the set of time ranges to represent the time ranges that fit between.
 * The inverted set starts with -Infinity and ends with Infinity.
 *
 * @param {TimeSpan[]} timespans - list of time ranges in chronological order
 * @returns {TimeSpan[]} the inverted set of time ranges
 */
export const invertTimeRangeSet = timespans => {
	// if the set is empty, return the set that includes all time
	if (timespans.length === 0) {
		return [{ startTime: -Infinity, endTime: Infinity }];
	}

	const inverted = [];

	// Begin at the beginning of time
	let start = -Infinity;
	// if the provided range already starts with -Infinity
	// start with its end time and remove it
	if (timespans[0].startTime === -Infinity) {
		start = timespans[0].endTime;
		timespans = timespans.slice(1);
	}
	// iterate through each timespan in the set and create time ranges that begin
	// with the previous range's end time and end with the range's beginning time.
	// The first range will start with -Infinity
	for (const timespan of timespans) {
		inverted.push({ startTime: start, endTime: timespan.startTime });
		start = timespan.endTime;
	}
	// Complete the last time range by taking the last endTime and ending
	// with inifinity unless the las timespan's endTime was Infinity
	if (start < Infinity) {
		inverted.push({ startTime: start, endTime: Infinity });
	}
	return inverted;
};

/**
 * Adjusts time to the nearest unit of time.
 *
 *   // current date in seconds
 *   const now = moment().unix();
 *   // adjust now to the nearest 15 minutes
 *   const fifteenMinutesInSeconds = 15 * 60;
 *   const adjusted = snapTimeToUnit(now, fifteenMinutesInSeconds);
 *
 * @param {number} time - time in arbitrary units
 * @param {number} snapUnits - the size in the same units as time to snap to
 * @param {string} [snappingStrategy=nearest] - nearest, earliest, latest when picking the
 *                                              rounding direcion
 * @returns {number} time adjusted to the nearest snapUnits
 */
export const snapTimeToUnit = (time, snapUnits, snappingStrategy = 'nearest') => {
	const offset = time % snapUnits;
	// if using the "nearest" snapping point and we're more than halfway passed the midpoint, advance
	const advance =
		(snappingStrategy === 'nearest' && offset >= snapUnits * 0.5) ||
		// if we're snapping to the 'latest' snap point, then advance no matter what
		snappingStrategy === 'latest';
	if (advance) {
		return time + (snapUnits - offset);
	}
	// if not advancing we're falling back to an earlier snapping point
	return time - offset;
};

/**
 * Given a timespan it will adjust the startTime and endTime to the nearest units.
 *
 * If given a timespan in seconds:
 *   const timespan = {startTime: moment().unix(), endTime: moment().add(2, 'hours').unix()};
 *
 * Snap the start and end to the nearest 15 minute unit (using 15 minutes in seconds)
 *   const snappedTimespan = snapToNearestSpan(timespan, 15 * 60 * 60);
 *
 * @param {TimeSpan} timespan - the timespan to adjust
 * @param {number} snapUnits - the number of units to snap to
 * @param {boolean} [growOnly=false] - when true only allows the timespan to grow when adjusting
 * @returns {TimeSpan} with start and end times adjusted to the nearest units
 */
export const snapToNearestSpan = (timespan, snapUnits, growOnly = false) => {
	return {
		startTime: snapTimeToUnit(timespan.startTime, snapUnits, growOnly ? 'earliest' : undefined),
		endTime: snapTimeToUnit(timespan.endTime, snapUnits, growOnly ? 'latest' : undefined),
	};
};

export const describeTime = time => {
	if (time === Infinity || time === -Infinity) {
		return 'whenever';
	}
	return new Date(time * 1000).toUTCString();
};

export const describeTimeSpan = span => {
	return `from ${describeTime(span.startTime)} to ${describeTime(span.endTime)}`;
};
