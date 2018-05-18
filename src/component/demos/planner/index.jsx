import { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';

import withGestures, { recognizeType, EVENT_TYPES } from 'component/block-graph/with-gestures';
import Block from './block';
import uuid from 'uuid/v4';
import { timeSpanContainsTime } from 'timespan';
import { applyGesture } from './gestures';
import { calculateMinSecond } from 'data/helpers';

const SECONDS_PER_HOUR = 60 * 60;

const EDGE_THRESHOLD = 10;

function detectDragMode(event, gesture) {
	const { match, point } = event.graphData;
	const { rect, block } = match;
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

const gestureRecognizer = recognizeType({
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

const BlockGraph = withGestures(gestureRecognizer);

export default class Planner extends React.Component {

	static propTypes = {
		initialData: PropTypes.arrayOf(PropTypes.shape({
			uid: PropTypes.string.isRequired,
			startTime: PropTypes.number.isRequired,
			endTime: PropTypes.number.isRequired,
		})),
		tickWidth: PropTypes.number.isRequired,
		rowHeight: PropTypes.number.isRequired,
	};

	static defaultProps = {
		tickWidth: 18,
		rowHeight: 48,
	};

	constructor(props) {
		super(props);
		this.state = {
			blocks: [],
			selectedBlockUids: [],
			originSeconds: 0,
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {
			blocks: nextProps.initialData,
			originSeconds: calculateMinSecond(nextProps.initialData),
		};
	}

	isSelectedBlock(block) {
		return this.state.selectedBlockUids.indexOf(block.uid) !== -1;
	}

	handleGestureChange = gesture => {
		if (gesture && gesture.type === 'selection') {
			this.setState( {selectedBlockUids: [gesture.selected.uid] });
		} else {
			this.setState({ selectedBlockUids: [] });
		}
	}

	applyGesture = (gesture, blocks) => {
		console.log('apply gesture', gesture);
		return applyGesture(gesture, blocks);
	}

	renderBlock = (block, rect) => {
		return (
			<Block
				key={block.uid}
				temp={block.gestured === true}
				type={block.type}
				isSelected={this.isSelectedBlock(block)}
				duration={block.endTime - block.startTime}
				{...rect}
			/>
		);
	}

	getIndexForBlock(block) {
		return block.row;
	}

	render() {
		const { blocks } = this.state || {};
		const { tickWidth, rowHeight } = this.props;
		// get the blocks that are the result of the gesture and the starting set of blocks
		return (
			<BlockGraph
				onGestureChange={this.handleGestureChange}
				renderBlock={this.renderBlock}
				applyGesture={this.applyGesture}
				pixelsPerSecond={(tickWidth * 4) / SECONDS_PER_HOUR}
				originSeconds={this.state.originSeconds}
				blocks={blocks}
				rows={{
					getIndexForBlock: this.getIndexForBlock,
					height: rowHeight,
					count: 20,
				}}
			/>
		);
	}
}