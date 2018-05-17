import { Component, createRef, PureComponent } from 'react';
import PropTypes from 'prop-types';

class Block extends PureComponent {
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		y: PropTypes.number.isRequired,
	};

	render() {
		const props = this.props;
		const style = {
			width: props.width,
			height: props.height,
			left: props.x,
			top: props.y,
			outline: '1px dotted #F00',
			position: 'absolute',
		};
		return (
			<div style={style}>
				{props.children}
			</div>
		);
	}
}

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

	constructor(props) {
		super(props);
		this.containerRef = createRef();
	}

	componentDidMount() {
		if (this.containerRef.current) {
			this.containerRef.current.addEventListener('scroll', this.observeScrolling);
		}
	}

	componentWillUnmount() {
		if (this.containerRef.current) {
			this.containerRef.current.removeEventListener('scroll', this.observeScrolling);
		}
	}

	observeScrolling = () => {
		// report what the user is actually looking at in time and rowIndex domain
	}

	getViewportMeasurements() {
		if (!this.containerRef.current) {
			return;
		}

		const node = this.containerRef.current;
		const pixels = {
			total: {
				x: 0,
				y: 0,
				width: node.scrollWidth,
				height: node.scrollHeight,
			},
			visible: {
				x: node.scrollLeft,
				y: node.scrollTop,
				width: node.clientWidth,
				height: node.clientHeight,
			},
		};
		const graph = {
			total: {
				x: this.convertPixelsToAbsoluteSeconds(0),
				y: 0,
				width: this.convertPixelsToSeconds(node.scrollWidth),
				height: this.convertPixelsToRow(node.scrollHeight),
			},
			visible: {
				x: this.convertPixelsToAbsoluteSeconds(node.scrollLeft),
				y: this.convertPixelsToRow(node.scrollTop),
				width: this.convertPixelsToSeconds(node.clientWidth),
				height: this.convertPixelsToRow(node.clientHeight),
			},
		};
		return { pixels, graph };
	}

	convertPixelsToRow(y) {
		return Math.floor(y / this.props.rows.height);
	}

	convertPixelsToSeconds(x) {
		return x / this.props.pixelsPerSecond;
	}

	convertPixelsToAbsoluteSeconds(x) {
		return this.convertPixelsToSeconds(x) + this.props.originSeconds;
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
			return <Block key={block.uid} {...rect}>{this.props.renderBlock(block)}</Block>;
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
				ref={this.containerRef}
			>
				{this.renderBlocks()}
			</div>
		);
	}
}
