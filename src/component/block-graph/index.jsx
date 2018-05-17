import { Component } from 'react';
import PropTypes from 'prop-types';

import './style';

export default class BlockGraph extends Component {
	static propTypes = {
		/**
		 * A list of items to draw on the screen
		 */
		blocks: PropTypes.arrayOf(PropTypes.shape({
			startTime: PropTypes.number.isRequired,
			endTime: PropTypes.number.isRequired,
		})).isRequired,
	};

	static defaultProps = {
		blocks: [],
	}

	render() {
		return <div className="block-graph">Hello World</div>;
	}
}
