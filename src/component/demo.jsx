import { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';

import BlockGraph from 'component/block-graph';
import DemoBlock from 'component/demo-block';
import uuid from 'uuid/v4';
import { timeSpanContainsTime } from 'timespan';
import { applyGesture } from 'gestures';

const HOUR_IN_PIXELS = 64;
const SECONDS_PER_HOUR = 60 * 60;

export default class Demo extends React.Component {

	static propTypes = {
		originSeconds: PropTypes.number.isRequired,
	}

	constructor(props) {
		super(props);
		this.state = {
			blocks: [],
			selectedBlockUids: [],
		};
	}

	isSelectedBlock(block) {
		return this.state.selectedBlockUids.indexOf(block.uid) !== -1;
	}

	findBlocksMatchingTimeIndex(timeIndex) {
		return this.state.blocks.filter((block) => {
			if (block.row === timeIndex.row) {
				if (timeSpanContainsTime(block, timeIndex.seconds)) {
					return true;
				}
			}
			return false;
		} );
	}

	handleClickGraph = (event, timeIndex) => {
		const maybe = this.findBlocksMatchingTimeIndex(timeIndex);
		this.setState({
			selectedBlockUids: maybe.map(block => block.uid),
		});
	}

	handleMouseDownGraph = (event, timeIndex) => {
		const matching = this.findBlocksMatchingTimeIndex(timeIndex);
		if (matching.length > 0) {
			// landed on at item, maybe allow resizing of that one item
			return;
		}
		event.preventDefault();
		this.setState({
			gesture: { type: 'multidraw', origin: timeIndex },
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
		return <DemoBlock key={block.uid} temp={block.gestured === true} isSelected={this.isSelectedBlock(block)} {...rect} />;
	}

	render() {
		const { blocks } = this.state || {};
		// get the blocks that are the result of the gesture and the starting set of blocks
		const gesturedBlocks = applyGesture(this.state.gesture, blocks);
		const getIndexForBlock = (block) => {
			return block.row;
		};
		return <div id="demo">
			<div id="demo-chrome">
			</div>
			<div id="graph-container">
				<BlockGraph
					onClickGraph={this.handleClickGraph}
					onMouseDownGraph={this.handleMouseDownGraph}
					onMouseUpGraph={this.handleMouseUpGraph}
					onMouseMoveGraph={this.handleMouseMoveGraph}
					renderBlock={this.renderBlock}
					pixelsPerSecond={HOUR_IN_PIXELS / SECONDS_PER_HOUR}
					originSeconds={this.props.originSeconds}
					blocks={gesturedBlocks}
					rows={{
						getIndexForBlock,
						height: 64,
						count: 20,
					}}
				/>
			</div>
		</div>;
	}
}