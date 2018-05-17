import { Component } from 'react';
import BlockGraph from 'component/block-graph';
import moment from 'moment';
import uuid from 'uuid/v4';
import { unionTimeSpanSet, timeSpansOverlap } from 'timespan';

const HOUR_IN_PIXELS = 100;
const SECONDS_PER_HOUR = 60 * 60;

const startOfDay = () => {
	return moment.utc().startOf('day').unix();
};

const randomSeconds = (size, min=0) => {
	return (Math.floor(Math.random() * size) + min) * 15 * 60; // random time in 15 minute intervals;
}

const generateBlock = (timestamp, row, quarterHours = 4) => {
	const startTime = randomSeconds(22 * 4) + timestamp;
	return {
		uid: uuid(), 
		row,
		startTime,
		endTime: startTime + randomSeconds(6, 3),
	};
};

const splitBy = (fn, list) => {
	return list.reduce(([matching, others], item) => {
		if (fn(item)) {
			return [[item, ...matching], others];
		}
		return [matching, [item, ...others]];
	}, [[], []])
}

const generateBlocksBeginning = (timestamp, total = 2000, rows = 200) => {
	let blocks = [];
	while (blocks.length < total) {
		blocks = blocks.concat([ generateBlock(timestamp, Math.floor(Math.random() * rows)) ]);
	}
	return blocks.reduce((merged, block) => {
		const [matching, others] = splitBy((maybe) => block.row === maybe.row && timeSpansOverlap(block, maybe), merged);
		const union = {
			...block,
			...unionTimeSpanSet([...matching, block])
		};
		return [union, ...others];
	}, []);
};

export default class Demo extends React.Component {

	handleRenderBlock = block => {
		return <div>Hi</div>;
	}

	render() {
		const origin = startOfDay();
		const blocks = generateBlocksBeginning(origin);
		const getIndexForBlock = (block) => {
			return block.row;
		};
		return <div id="demo">
			<div id="demo-chrome">
			</div>
			<div id="graph-container">
				<BlockGraph
					renderBlock={this.handleRenderBlock}
					pixelsPerSecond={HOUR_IN_PIXELS / SECONDS_PER_HOUR}
					originSeconds={origin}
					blocks={blocks}
					rows={{
						getIndexForBlock,
						height: 80,
						count: 20,
					}}
				/>
			</div>
		</div>;
	}
}