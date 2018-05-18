import { recognizeType, EVENT_TYPES } from 'component/block-graph/with-gestures';

const EDGE_THRESHOLD = 10;

function detectDragMode(event) {
	const { match, point } = event.graphData;
	const { rect } = match;
	const leftDelta = Math.abs(rect.x - point.x);
	const rightDelta = Math.abs(rect.x + rect.width - point.x);
	// point is the coordinate within the graph
	// rect is where the block is within the graph
	// if we're within a threshold of either side we
	// only want to drag one side
	if (leftDelta <= EDGE_THRESHOLD) {
		return 'left';
	}
	if (rightDelta <= EDGE_THRESHOLD) {
		return 'right';
	}
	return 'both';
}

export default recognizeType({
	[EVENT_TYPES.MOUSEDOWN]: (event, gesture) => {
		if (event.graphData.match) {
			// clicked on a block
			return {
				type: 'drag',
				origin: event.graphData,
				destination: event.graphData,
				dragMode: detectDragMode(event, gesture),
				block: event.graphData.match.block,
			};
		}
		return { type: 'multidraw', blockType: 'a', origin: event.graphData };
	},
	[EVENT_TYPES.MOUSEMOVE]: (event, gesture) => {
		if (!gesture) {
			return gesture;
		}
		if (gesture && gesture.type !== 'multidraw' && gesture.type !== 'drag') {
			return gesture;
		}
		event.event.preventDefault();
		return { ... gesture, destination: event.graphData };
	},
	[EVENT_TYPES.MOUSEUP]: (event, gesture) => {
		if (!gesture) {
			return { type: 'idle' };
		}
		if (gesture.type === 'multidraw') {
			return { type: 'idle' };
		}

		if (gesture.type === 'drag') {
			// if the drag was less than a certain distance, consider it a selection
			const { match } = event.graphData;
			if (match) {
				return { type: 'selection', selected: match.block }
			}
			return { type: 'idle' };
		}

		return gesture;
	},
	[EVENT_TYPES.CLICK]: (event, gesture) => {
		// there is no existing gesture, or the existing gesture is an accept gesture
		if (!gesture || gesture.type === 'selection' ) {
			// TODO: multi selection
			if (event.graphData.match) {
				return { type: 'selection', selected: event.graphData.match.block };
			}
			return { type: 'idle' };
		}

		// if this is the end of a drag gesture, keep the block selected
		if (gesture.type === 'drag') {
			return { type: 'selection', selected: event.graphData.match.block };
		}

		return gesture;
	},
});
