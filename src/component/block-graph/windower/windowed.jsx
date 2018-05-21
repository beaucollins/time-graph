import { Fragment } from 'react';

/**
 * Two dimensional windower.
 */
export default (windowSize, datasource) => {
	const windows = {};

	const windowKey = ({ x, y }) => `${x}-${y}`;

	const indexBlocks = (w, blocks) => {
		windows[windowKey(w)] = blocks;
	};

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

	const invertPoint = ({ x, y }) => ({ x: -x, y: -y });

	const sumPoints = (...points) => points.reduce(({ x, y }, point) => {
		return {
			x: x + point.x,
			y: y + point.y,
		};
	}, { x: 0, y: 0 });

	const expandViewport = ([ p1, p2 ]) => {
		const size = sumPoints(invertPoint(p1), p2);
		return [
			sumPoints(p1, invertPoint(size)),
			sumPoints(p2, size),
		];
	}

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
		getVisibleItems: (viewport) => {
			const windowed = mapWindows(expandViewport(viewport), (w) => {
				const cache = windows[windowKey(w)] || [];
				return cache;
			});
			return windowed.reduce((flattened, items) => {
				return flattened.concat(items);
			}, []);
		},
		renderVisibleWindows: (viewport, renderBlock, convertPoint) => {
			return mapWindows(expandViewport(viewport), (w) => {
				const range = [
					convertPoint(w),
					convertPoint(translateWindow(w)),
				];
				const blocks = datasource({
					timeSpan: { startTime: range[0].seconds, endTime: range[1].seconds },
					rowSpan: { startIndex: range[0].row, endIndex: range[1].row },
				});
				indexBlocks(w, blocks);
				return (
					<Fragment key={windowKey(w)}>
						{blocks.map(renderBlock)}
					</Fragment>
				);
			});
		},
	};
};