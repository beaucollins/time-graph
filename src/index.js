import React from 'react';
import { render } from 	'react-dom';

import App from 'component/app';
import moment from 'moment';
import { generateBlocksBeginning } from 'data/helpers';

import 'demo.scss';

window.generateBlocks = (quantity = undefined, rows = undefined) => {
	return JSON.stringify(generateBlocksBeginning(
		moment().utc().startOf('day').unix(),
		quantity,
		rows
	));
};

const rootNode = document.createElement('div');
rootNode.id = 'root';

document.body.appendChild(rootNode);

render(<App />, rootNode);
