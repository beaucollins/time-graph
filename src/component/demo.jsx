import { Component } from 'react';
import BlockGraph from 'component/block-graph';

const HOUR_IN_PIXELS = 100;
const SECONDS_PER_HOUR = 60 * 60;

export default class Demo extends React.Component {
	render() {
		return <div id="demo">
			<div id="demo-chrome">
			</div>
			<div id="graph-container">
				<BlockGraph
					pixelsPerSecond={HOUR_IN_PIXELS / SECONDS_PER_HOUR}
				/>
			</div>
		</div>;
	}
}