import { Component } from 'react';
import withGestures from 'component/block-graph/with-gestures';

import { SECONDS_PER_HOUR, SECONDS_PER_DAY } from 'timespan';

const recognizer = (event, gesture) => {
	return null;
};

const gestureApplier = (gesture, blocks) => {
	return blocks;
};

const GestureGraph = withGestures(recognizer);

export default class AvailabilityPlanner extends Component {
	render() {
		return (
			<GestureGraph
				timeSpan={{
					startTime: 0,
					endTime: SECONDS_PER_DAY,
				}}
				chromeOffset={{
					header: 48,
					sidebar: 164,
				}}
				pixelsPerSecond={100 / SECONDS_PER_HOUR}
				originSeconds={0}
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
			</GestureGraph>
		);
	}
}