import { Fragment } from 'react';

export default (windowSize, dataProvider) => {
	const range = {
		timeSpan: { startTime: -Infinity, endTime: Infinity },
		rowSpan: { startIndex: -Infinity, endIndex: Infinity },
	};
	return {
		// everything is always visible
		getVisibleItems: () => {
			return dataProvider(range);
		},
		// always render everything
		renderVisibleWindows: (viewPort, renderBlock) => {
			return (
				<Fragment key="all">
					{dataProvider(range).map(renderBlock)}
				</Fragment>
			);
		},
	};
};