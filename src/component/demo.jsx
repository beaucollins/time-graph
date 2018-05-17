import { Component } from 'react';
import BlockGraph from 'component/block-graph';

export default class Demo extends React.Component {
	render() {
		return <div id="demo">
			<div id="demo-chrome">
			</div>
			<div id="graph-container">
				<BlockGraph
				/>
			</div>
		</div>;
	}
}