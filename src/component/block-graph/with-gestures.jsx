import { Component } from 'react';
import PropTypes from 'prop-types';
import BlockGraph from './index';

function getDisplayName(WrappedComponent) {
	return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export function matchType(matchers = {}, noMatch = () => {}) {
	return function(typedObject, ...args) {
		const matched = typedObject && matchers[typedObject.type];
		if (matched && typeof matched === 'function') {
			return matched(typedObject, ...args);
		}
		return noMatch(typedObject, ...args);
	};
}

export const recognizeType = matchers => matchType(matchers, (event, gesture) => gesture);

export const EVENT_TYPES = {
	MOVE: 'click',
	MOUSEDOWN: 'mousedown',
	MOUSEMOVE: 'mousemove',
	MOUSEUP: 'mouseup',
};

/**
 * @param {Function} recognizer - transforms a gesture into a new gesture
 * @param {Function} applier - produces new block state based on the current gesture
 * @returns {Component} component with gesture recognizers
 */
export default function withGestures(recognizer = () => null) {
	class WithGestures extends Component {
		static propTypes = {
			...BlockGraph.propTypes,
			onGestureChange: PropTypes.func,
			applyGesture: PropTypes.func,
		}

		static defaultProps = {
			...BlockGraph.defaultProps,
			onGestureChange: () => {},
			applyGesture: (gesture, blocks) => ({ unchanged: blocks }),
		};

		handle = (type, parentHandler) => (event, graphData) => {
			// console.log('do it', type, timeIndex, blocks.length);
			// TODO: allow parent handler to do something?
			parentHandler(event, graphData);
			this.setState({ gesture: recognizer({ type, event, graphData }, this.state.gesture) });
		}

		constructor(props) {
			super(props);
			this.state = {};
		}

		componentDidUpdate(_, prevState) {
			if (prevState.gesture !== this.state.gesture) {
				const { applyGesture, blocks } = this.props;
				this.props.onGestureChange(this.state.gesture, prevState.gesture, (gesture) => {
					return applyGesture(gesture, blocks);
				});
			}
		}

		render() {
			const {
				onClickGraph,
				onMouseDownGraph,
				onMouseMoveGraph,
				onMouseUpGraph,
				blocks,
				applyGesture,
				onGestureChange,
				...subProps
			} = this.props;

			const handlers = {
				onClickGraph: this.handle(EVENT_TYPES.CLICK, onClickGraph),
				onMouseDownGraph: this.handle(EVENT_TYPES.MOUSEDOWN, onMouseDownGraph),
				onMouseMoveGraph: this.handle(EVENT_TYPES.MOUSEMOVE, onMouseMoveGraph),
				onMouseUpGraph: this.handle(EVENT_TYPES.MOUSEUP, onMouseUpGraph),
			};

			const { gesture } = this.state;
			const { unchanged, modified } = applyGesture(gesture, this.props.blocks);
			const graphBlocks = modified && modified.length > 0 ? [...unchanged, ...modified] : unchanged;
			return (
				<BlockGraph {...handlers} {...subProps} blocks={graphBlocks}></BlockGraph>
			);
		}
	}
	WithGestures.displayName = `WithGestures(${getDisplayName(BlockGraph)})`;
	return WithGestures;
}
