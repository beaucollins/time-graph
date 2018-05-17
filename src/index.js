import React from 'react';
import { render } from 	'react-dom';
import Demo from 'component/demo';

import 'demo.scss';

const rootNode = document.createElement('div');
rootNode.id = 'root';

document.body.appendChild(rootNode);

render(<Demo />, rootNode);
