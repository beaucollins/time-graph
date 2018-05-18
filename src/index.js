import React from 'react';
import { render } from 	'react-dom';
import Demo from 'component/demo';
import { unionTimeSpanSet, timeSpansOverlap } from 'timespan';
import moment from 'moment';
import uuid from 'uuid/v4';
import { splitBy } from 'gestures';
import demoData from 'data/common.json';

import 'demo.scss';

const randomType = () => {
	const types = ['a', 'b', 'c'];
	return types[Math.floor(Math.random() * types.length)];
};

const randomSeconds = (size, min = 0) => {
	return (Math.floor(Math.random() * size) + min) * 15 * 60; // random time in 15 minute intervals;
};

const generateBlock = (timestamp, row, quarterHours = 4) => {
	const startTime = randomSeconds(22 * 4) + timestamp;
	return {
		uid: uuid(),
		row,
		startTime,
		type: randomType(),
		endTime: startTime + randomSeconds(quarterHours, 3),
	};
};

const generateBlocksBeginning = (timestamp, total = 2000, rows = 200) => {
	let blocks = [];
	while (blocks.length < total) {
		blocks = blocks.concat([ generateBlock(timestamp, Math.floor(Math.random() * rows)) ]);
	}
	return blocks.reduce((merged, block) => {
		const [matching, others] = splitBy((maybe) => block.row === maybe.row &&
			timeSpansOverlap(block, maybe), merged);

		const union = {
			...block,
			...unionTimeSpanSet([...matching, block]),
		};
		return [union, ...others];
	}, []);
};

window.generateBlocks = (quantity = undefined, rows = undefined) => {
	return JSON.stringify(generateBlocksBeginning(moment().utc().startOf('day').unix(), quantity, rows));
};

window.clearBlocks = () => {
	localStorage.clear();
};

const calculateMinSecond = (data) => {
	const min = data.reduce((origin, block) => {
		return block.startTime < origin ? block.startTime : origin;
	}, Infinity);
	return moment.unix(min).utc().startOf('day').unix();
};

const originSeconds = calculateMinSecond(demoData);

const rootNode = document.createElement('div');
rootNode.id = 'root';

document.body.appendChild(rootNode);

const app = render(<Demo />, rootNode);

app.setState({ blocks: demoData, originSeconds });
