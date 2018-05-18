import { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';

import withGestures, { recognizeType, matchType, EVENT_TYPES } from 'component/block-graph/with-gestures';
import Block from './block';
import uuid from 'uuid/v4';
import { timeSpanContainsTime } from 'timespan';
import { applyGesture } from './gestures';
import { calculateMinSecond } from 'data/helpers';

const SECONDS_PER_HOUR = 60 * 60;

const gestureRecognizer = recognizeType({
	[EVENT_TYPES.MOUSEDOWN]: (event, gesture) => {
		if (event.graphData.match) {
			// clicked on a block
			// TODO: prepare for dragging operation of some kind
			return null;
		}
		event.event.preventDefault();
		return { type: 'multidraw', blockType: 'a', origin: event.graphData };
	},
	[EVENT_TYPES.MOUSEMOVE]: (event, gesture) => {
		if (gesture && gesture.type !== 'multidraw') {
			return gesture;
		}
		return { ... gesture, destination: event.graphData };
	},
	[EVENT_TYPES.MOUSEUP]: (event, gesture) => {
		if (gesture && gesture.type === 'multidraw') {
			return null;
		}
		return gesture;
	},
	[EVENT_TYPES.CLICK]: (event, gesture) => {
		// There is an existing gesture, but it's not a selection gesture, so ignore?
		if (gesture && gesture.type !== 'selection') {
			return gesture;
		}
		// when the click didn't hit a block, we'll clear the gesture
		if (!event.graphData.match) {
			return null;
		}
		// if there's an existing gesture and that gesture is
		// a selection gesture and we matched
		//
		// TODO: allow multi select when there is a key modifier
		return { type: 'selection', selected: event.graphData.match.block };
	},
});

const gestureApplier = matchType({
	multidraw: (gesture, blocks) => {
		return applyGesture(gesture, blocks);
	}
}, (_, blocks) => blocks);

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
		return gestureApplier(gesture, blocks);
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