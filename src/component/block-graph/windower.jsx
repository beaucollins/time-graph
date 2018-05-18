import { Fragment } from 'react';

export default (windowSize, datasource) => {
	const windowForPoint = point => {
		const modX = point.x % windowSize.width;
		const modY = point.y % windowSize.height;
		return { x: point.x - modX, y: point.y - modY };
	};

	const translateWindow = ({ x, y }) => {
		return {
			x: windowSize.width + x,
			y: windowSize.height + y,
		};
	};

	const snapViewPortToWindows = ([a, b]) => {
		return [{
			x: Math.floor(a.x / windowSize.width) * windowSize.width,
			y: Math.floor(a.y / windowSize.height) * windowSize.height,
		}, {
			x: Math.ceil(b.x / windowSize.width) * windowSize.width,
			y: Math.ceil(b.y / windowSize.height) * windowSize.height,
		}];
	};

	const mapWindows = (viewport, iterator) => {
		const result = [];
		const [a, b] = snapViewPortToWindows(viewport);
		const current = { ...a };
		while (current.x < b.x) {
			while (current.y < b.y) {
				result.push(iterator({ x: current.x, y: current.y }));
				current.y += windowSize.height;
			}
			current.y = a.y;
			current.x += windowSize.width;
		}
		return result;
	};
	return {
		windowForPoint,
		renderVisibleWindows: (viewport, renderBlock, convertPoint) => {
			return mapWindows(viewport, (w) => {
				const style = {
					...windowSize,
					left: w.x,
					top: w.y,
					position: 'absolute',
					color: '#999',
					boxSizing: 'border-box',
					border: '1px solid #CCC',
				};
				const range = [
					convertPoint(w),
					convertPoint(translateWindow(w)),
				];
				const blocks = datasource({
					timeSpan: { startTime: range[0].seconds, endTime: range[1].seconds },
					rowSpan: { startIndex: range[0].row, endIndex: range[1].row },
				});
				return (
					<Fragment key={`${w.x},${w.y}`}>
						{blocks.map(renderBlock)}
						<div style={style}>
							{JSON.stringify(range, null, ' ')}
						</div>
					</Fragment>
				);
			});
		},
	};
};