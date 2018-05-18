import { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';

import { timeSpanContainsTime } from 'timespan';
import Block from './block';

function invertPoint({ x, y }) {
	return { x: -x, y: -y };
}

function sumPoints(... points) {
	return points.reduce(({ x, y }, point) => ({ x: x + point.x, y: y + point.y }), { x: 0, y: 0 });
}

export default class BlockGraph extends Component {
	static propTypes = {
		onClickGraph: PropTypes.func,
		onMouseDownGraph: PropTypes.func,
		onMouseMoveGraph: PropTypes.func,
		onMouseUpGraph: PropTypes.func,

		chromeOffset: PropTypes.shape({
			header: PropTypes.number.isRequired,
			sidebar: PropTypes.number.isRequired,
		}),

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
		chromeOffset: {
			header: 0,
			sidebar: 0,
		},
		blocks: [],
		renderBlock: (block, rect) => <Block key={block.uid} {...rect} />,
		onClickGraph: () => {},
		onMouseDownGraph: () => {},
		onMouseMoveGraph: () => {},
		onMouseUpGraph: () => {},
	}

	constructor(props) {
		super(props);
		this.containerRef = createRef();
		this.state = {};
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

	observeScrolling = throttle(() => {
	}, 100);

	getViewportMeasurements() {
		if (!this.containerRef.current) {
			return { pixels: {}, graph: {} };
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
		return this.convertSecondsToPixels(seconds - this.props.originSeconds) + this.props.chromeOffset.sidebar;
	}

	convertViewPortPoint(point) {
		const node = this.containerRef.current;

		if (!node) {
			return { x: 0, y: 0 };
		}

		return sumPoints(
			point,
			invertPoint(node.getBoundingClientRect()),
			invertPoint({ x: this.props.chromeOffset.sidebar, y: this.props.chromeOffset.header }),
			{ x: node.scrollLeft, y: node.scrollTop }
		);
	}

	getEventPoint(event) {
		return this.convertViewPortPoint({
			x: event.clientX,
			y: event.clientY,
		});
	}

	convertPointToTimeIndex(point) {
		return {
			seconds: this.convertPixelsToAbsoluteSeconds(point.x),
			row: this.convertPixelsToRow(point.y),
		};
	}

	getEventData(event) {
		const point = this.getEventPoint(event);
		const timeIndex = this.convertPointToTimeIndex(point);
		return {
			timeIndex,
			point,
			match: this.filterMatchingBlock(timeIndex, point),
		};
	}

	filterMatchingBlock(timeIndex, point) {
		const matching = this.props.blocks.filter(block => {
			return timeSpanContainsTime(block, timeIndex.seconds) &&
				this.props.rows.getIndexForBlock(block) === timeIndex.row;
		});
		if (matching && matching.length > 0) {
			// TODO: calculate where the box was clicked
			const block = matching[0];
			const rect = this.getRectForBlock(block);
			return { block, rect };
		}
		return null;
	}

	handleOnClick = event => {
		// now we can convert the x to time and the y to a row index
		const eventData = this.getEventData(event);
		this.props.onClickGraph(event, eventData);
	}

	handleOnMouseDown = event => {
		const eventData = this.getEventData(event);
		this.props.onMouseDownGraph(event, eventData);
	}

	handleOnMouseUp = event => {
		const eventData = this.getEventData(event);
		// filter to the matching timestamps
		this.props.onMouseUpGraph(event, eventData);
	}

	handleOnMouseMove = event => {
		const eventData = this.getEventData(event);
		this.props.onMouseMoveGraph(event, eventData);
	}

	getRectForBlock(block) {
		return {
			x: this.convertAbsoluteSecondsToPixels(block.startTime),
			width: this.convertSecondsToPixels(block.endTime - block.startTime),
			y: this.props.rows.getIndexForBlock(block) * this.props.rows.height + this.props.chromeOffset.header,
			height: this.props.rows.height,
		};
	}

	renderBlocks = () => {
		return this.props.blocks.map(block => {
			const rect = this.getRectForBlock(block);
			return this.props.renderBlock(block, rect);
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
				onClick={this.handleOnClick}
				onMouseMove={this.handleOnMouseMove}
				onMouseDown={this.handleOnMouseDown}
				onMouseUp={this.handleOnMouseUp}
				ref={this.containerRef}
			>
				{this.props.children && <div>{this.props.children}</div>}
				<div>
					{this.renderBlocks()}
				</div>
			</div>
		);
	}
}
