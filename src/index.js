import React from 'react';
import { render } from 	'react-dom';
import Demo from 'component/demo';
import { unionTimeSpanSet, timeSpansOverlap } from 'timespan';
import moment from 'moment';
import uuid from 'uuid/v4';
import { splitBy } from 'gestures';

import 'demo.scss';

const startOfDay = () => {
	return moment.utc().startOf('day').unix();
};

const origin = startOfDay();

const rootNode = document.createElement('div');
rootNode.id = 'root';

document.body.appendChild(rootNode);

const app = render(<Demo originSeconds={origin} />, rootNode);

const randomSeconds = (size, min = 0) => {
	return (Math.floor(Math.random() * size) + min) * 15 * 60; // random time in 15 minute intervals;
};

const generateBlock = (timestamp, row, quarterHours = 4) => {
	const startTime = randomSeconds(22 * 4) + timestamp;
	return {
		uid: uuid(),
		row,
		startTime,
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
	localStorage.blocks = JSON.stringify(generateBlocksBeginning(origin, quantity, rows));
	console.log('done');
};

window.clearBlocks = () =>  {
	localStorage.clear();
};

if (localStorage.blocks) {
	try {
		const blocks = JSON.parse(localStorage.blocks);
		app.setState({ blocks });
		console.log('total blocks', blocks.length);
	} catch (error) {
		localStorage.clear();
		window.location.reload();
	}
} else {
	const blocks = generateBlocksBeginning(origin);
	localStorage.blocks = JSON.stringify(blocks);
	app.setState({ blocks });
}
