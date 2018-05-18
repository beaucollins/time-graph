import { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';

import BlockGraph from 'component/block-graph';
import Block from './block';
import uuid from 'uuid/v4';
import { timeSpanContainsTime } from 'timespan';
import { applyGesture } from './gestures';
import { calculateMinSecond } from 'data/helpers';

const SECONDS_PER_HOUR = 60 * 60;

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

	handleClickGraph = (event, timeIndex) => {
		const { match } = timeIndex
		this.setState({
			selectedBlockUids: match ? [match.block.uid] : [] ,
		});
	}

	handleMouseDownGraph = (event, timeIndex) => {
		const { match } = timeIndex;
		if (match) {
			// landed on at item, maybe allow resizing of that one item
			return;
		}
		event.preventDefault();
		console.log('start gesture?');
		this.setState({
			gesture: { type: 'multidraw', blockType: 'a', origin: timeIndex },
		});
	}

	handleMouseMoveGraph = (event, timeIndex) => {
		const gesture = this.state.gesture;
		if (gesture && gesture.type === 'multidraw') {
			event.preventDefault();
			this.setState({
				gesture: { ... gesture, destination: timeIndex },
			});
		}
	}

	handleMouseUpGraph = (enent, timeIndex) => {
		this.setState({gesture: null});
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

	render() {
		const { blocks } = this.state || {};
		const { tickWidth, rowHeight } = this.props;
		// get the blocks that are the result of the gesture and the starting set of blocks
		const gesturedBlocks = applyGesture(this.state.gesture, blocks);
		const getIndexForBlock = (block) => {
			return block.row;
		};
		return (
			<BlockGraph
				onClickGraph={this.handleClickGraph}
				onMouseDownGraph={this.handleMouseDownGraph}
				onMouseUpGraph={this.handleMouseUpGraph}
				onMouseMoveGraph={this.handleMouseMoveGraph}
				renderBlock={this.renderBlock}
				pixelsPerSecond={(tickWidth * 4) / SECONDS_PER_HOUR}
				originSeconds={this.state.originSeconds}
				blocks={gesturedBlocks}
				rows={{
					getIndexForBlock,
					height: rowHeight,
					count: 20,
				}}
			/>
		);
	}
}