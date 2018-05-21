import { Component } from 'react';
import withGestures from 'component/block-graph/with-gestures';
import recognizer from '../planner/recognizer';

import { SECONDS_PER_HOUR, SECONDS_PER_DAY } from 'timespan';


const gestureApplier = (gesture, blocks) => {
	return { updated: [], modified: [] };
};

const BlockGraph = withGestures(recognizer);

export default class AvailabilityPlanner extends Component {

	applyGesture = (gesture, data) => {
		return gestureApplier(gesture, data);
	}

	render() {
		return (
			<BlockGraph
				timeSpan={{
					startTime: 0,
					endTime: SECONDS_PER_DAY,
				}}

				chromeOffset={{
					header: 48,
					sidebar: 164,
				}}

				pixelsPerSecond={100 / SECONDS_PER_HOUR}

				applyGesture={this.applyGesture}

				blocks={[{ uid: 'test', startTime: 3600, endTime: 3600 * 2 }]}
				rows={{
					height: 86,
					count: 7,
					getIndexForBlock: block => {
						return 0;
					},
				}}
			>
				<div>Hello world</div>
				<div></div>
			</BlockGraph>
		);
	}
}