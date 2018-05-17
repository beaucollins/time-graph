import { Component } from 'react';
import PropTypes from 'prop-types';

import BlockGraph from 'component/block-graph';
import uuid from 'uuid/v4';

const HOUR_IN_PIXELS = 100;
const SECONDS_PER_HOUR = 60 * 60;

export default class Demo extends React.Component {

	static propTypes = {
		originSeconds: PropTypes.number.isRequired,
	}

	handleRenderBlock = block => {
		return <div>Hi</div>;
	}

	render() {
		const { blocks } = this.state || {};
		const getIndexForBlock = (block) => {
			return block.row;
		};
		return <div id="demo">
			<div id="demo-chrome">
			</div>
			<div id="graph-container">
				<BlockGraph
					renderBlock={this.handleRenderBlock}
					pixelsPerSecond={HOUR_IN_PIXELS / SECONDS_PER_HOUR}
					originSeconds={this.props.originSeconds}
					blocks={blocks || []}
					rows={{
						getIndexForBlock,
						height: 80,
						count: 20,
					}}
				/>
			</div>
		</div>;
	}
}