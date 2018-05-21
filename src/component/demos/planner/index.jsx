import { Component } from 'react';
import PropTypes from 'prop-types';

import withGestures from 'component/block-graph/with-gestures';
import Block from './block';
import { snapToNearestSpan, SECONDS_PER_DAY } from 'timespan';
import gestureRecognizer from './recognizer';
import applyGesture from './applier';
import windowed from 'component/block-graph/windower/windowed';

const SECONDS_PER_HOUR = 60 * 60;

const BlockGraph = withGestures(gestureRecognizer);

export default class Planner extends Component {
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
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { rows, startTime, endTime } = nextProps.initialData.reduce((values, block) => {
			return {
				rows: Math.max(values.rows, block.row),
				startTime: Math.min(values.startTime, block.startTime),
				endTime: Math.max(values.endTime, block.endTime),
			};
		}, { rows: 0, startTime: Infinity, endTime: -Infinity });
		const timeSpan = snapToNearestSpan({ startTime, endTime }, SECONDS_PER_DAY, true);
		return {
			blocks: nextProps.initialData,
			timeSpan: {
				startTime: isNaN(timeSpan.startTime) ? 0 : timeSpan.startTime,
				endTime: isNaN(timeSpan.endTime) ? SECONDS_PER_DAY : timeSpan.endTime,
			},
			rows: rows === 0 ? 25 : rows,
		};
	}

	isSelectedBlock(block) {
		return this.state.selectedBlockUids.indexOf(block.uid) !== -1;
	}

	handleGestureChange = (gesture, prevGesture, applier) => {
		if (gesture && gesture.type === 'selection') {
			this.setState({ selectedBlockUids: [gesture.selected.uid] });
		} else {
			this.setState({ selectedBlockUids: [] });
		}
		if (gesture.type === 'complete') {
			const changes = applier(gesture.gesture);
			console.log('time to commit changes', changes);
		}
	}

	applyGesture = (gesture, blocks) => {
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
		const { blocks, timeSpan, rows } = this.state;
		const { tickWidth, rowHeight } = this.props;
		// get the blocks that are the result of the gesture and the starting set of blocks
		return (
			<BlockGraph
				chromeOffset={{
					header: 36,
					sidebar: 200,
				}}

				windower={windowed}

				onGestureChange={this.handleGestureChange}
				renderBlock={this.renderBlock}
				applyGesture={this.applyGesture}
				pixelsPerSecond={(tickWidth * 4) / SECONDS_PER_HOUR}
				blocks={blocks}
				timeSpan={timeSpan}
				rows={{
					getIndexForBlock: this.getIndexForBlock,
					height: rowHeight,
					count: rows,
				}}
			/>
		);
	}
}
