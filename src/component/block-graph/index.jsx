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
		/**
		 * The coefficient that converts a measument in seconds into a measurement in pixels
		 */
		pixelsPerSecond: PropTypes.number.isRequired,
		/**
		 * The constant in seconds that defines the "left edge" of the graph
		 */
		originSeconds: PropTypes.number.isRequired,
	};

	static defaultProps = {
		blocks: [],
	}

	/**
	 * @param {number} seconds - a quantity of seconds
	 * @returns {number} the measurement in pixels that represents the seconds for this graph
	 */
	covertSecondsToPixels(seconds) {
		return this.props.pixelsPerSecond * seconds;
	}

	/**
	 * @param {number} seconds - seconds since the epoch
	 * @returns {number} pixel x value that represents that second in this intance of the graph
	 */
	convertAbsoluteSecondsToPixels(seconds) {
		// figure out
		return this.convertSecondsToPixels(seconds - this.props.originSeconds);
	}

	render() {
		return <div className="block-graph">Hello World</div>;
	}
}
