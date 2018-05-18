import { Component } from 'react';
import BlockGraph from './index';

function getDisplayName(WrappedComponent) {
	return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

/**
 * @param {Function} recognizer - transforms a gesture into a new gesture
 * @param {Function} applier - produces new block state based on the current gesture
 */
export default function withGestures(recognizer = () => null, applier = (_, blocks) => blocks ) {
	class WithGestures extends Component {
		static propTypes = BlockGraph.propTypes;
		static defaultProps = BlockGraph.defaultProps;

		handle = (type, parentHandler) => (event, timeIndex, blocks) => {
			// console.log('do it', type, timeIndex, blocks.length);
			// TODO: allow parent handler to do something?
			parentHandler(event, timeIndex, blocks);
			this.setState({ gesture: recognizer({ type, event, timeIndex, blocks }) });
		}

		constructor(props) {
			super(props);
			this.state = {};
		}

		render() {
			const {
				onClickGraph,
				onMouseDownGraph,
				onMouseMoveGraph,
				onMouseUpGraph,
				blocks,
				...subProps
			} = this.props;

			const handlers = {
				onClickGraph: this.handle('click', onClickGraph),
				onMouseDownGraph: this.handle('mousedown', onMouseDownGraph),
				onMouseMoveGraph: this.handle('mousemove', onMouseMoveGraph),
				onMouseUpGraph: this.handle('mouseup', onMouseUpGraph),
			};

			const { gesture } = this.state;
			const gestureBlocks = applier(gesture, this.props.blocks);
			return (
				<BlockGraph {...handlers} {...subProps} blocks={gestureBlocks}></BlockGraph>
			);
		}
	}
	WithGestures.displayName = `WithGestures(${getDisplayName(BlockGraph)})`;
	return WithGestures;
}
