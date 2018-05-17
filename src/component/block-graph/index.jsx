import { Component } from 'react';
import PropTypes from 'prop-types';

function Block(props) {
	const style = {
		width: props.rect.width,
		height: props.rect.height,
		left: props.rect.x,
		top: props.rect.y,
		outline: '1px dotted #F00',
		position: 'absolute',
	};
	return (
		<div style={style}>
			{props.children}
		</div>
	);
}

Block.propTypes = {
	rect: PropTypes.shape({
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		y: PropTypes.number.isRequired,
	}).isRequired,
};

export default class BlockGraph extends Component {
	static propTypes = {
		renderBlock: PropTypes.func.isRequired,
		/**
		 * A list of items to draw on the screen
		 */
		blocks: PropTypes.arrayOf(PropTypes.shape({
			uid: PropTypes.string.isRequired,
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
		rows: PropTypes.shape({
			// tell <BlockGraph> which row a block belongs to
			getIndexForBlock: PropTypes.func.isRequired,
			// how tall is a row in pixels
			height: PropTypes.number.isRequired,
			// how many rows are there
			count: PropTypes.number.isRequired,
		}).isRequired,
	};

	static defaultProps = {
		blocks: [],
		renderBlock: () => null,
	}

	/**
	 * @param {number} seconds - a quantity of seconds
	 * @returns {number} the measurement in pixels that represents the seconds for this graph
	 */
	convertSecondsToPixels(seconds) {
		return this.props.pixelsPerSecond * seconds;
	}

	/**
	 * @param {number} seconds - seconds since the epoch
	 * @returns {number} pixel x value that represents that second in this intance of the graph
	 */
	convertAbsoluteSecondsToPixels(seconds) {
		return this.convertSecondsToPixels(seconds - this.props.originSeconds);
	}

	renderBlocks = () => {
		return this.props.blocks.map(block => {
			const rect = {
				x: this.convertAbsoluteSecondsToPixels(block.startTime),
				width: this.convertSecondsToPixels(block.endTime - block.startTime),
				y: this.props.rows.getIndexForBlock(block) * this.props.rows.height,
				height: this.props.rows.height,
			};
			return <Block key={block.uid} rect={rect}>{this.props.renderBlock(block)}</Block>;
		});
	}

	render() {
		const style = {
			position: 'relative',
			overflow: 'auto',
		};
		return (
			<div
				style={style}
			>
				{this.renderBlocks()}
			</div>
		);
	}
}
