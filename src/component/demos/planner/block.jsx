import { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from 'timespan';

const colors = {
	a: 0,
	b: 128,
	c: 255,
};

const DEFAULT_HUE = 26;

const Duration = props => {
	const hours = Math.floor(props.seconds / SECONDS_PER_HOUR);
	const minutes = Math.ceil((props.seconds - hours * SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
	return (
		<div>
			{ hours > 0 && `${hours}h ` }
			{ minutes > 0 && `${minutes}m` }
		</div>
	);
};

Duration.propTypes = {
	seconds: PropTypes.number.isRequired,
};

export default class DemoBlock extends PureComponent {
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		y: PropTypes.number.isRequired,
		temp: PropTypes.bool,
		type: PropTypes.string.isRequired,
		duration: PropTypes.number.isRequired,
	};

	static defaultProps = {
		temp: false,
	};

	render() {
		const props = this.props;
		const { isSelected, type, duration, temp } = props;
		const style = {
			width: props.width,
			height: props.height,
			left: props.x,
			top: props.y,
			position: 'absolute',
		};
		const hue = colors[type] || DEFAULT_HUE;
		const innerStyle = {
			position: 'absolute',
			top: 10,
			bottom: 10,
			left: 4,
			right: 4,
			background: temp ? `hsla(${hue}, 20%, 50%, 0.25)` : `hsl(${hue}, 20%, 50%)`,
			borderRadius: 2,
			border: temp ? `1px solid hsla(${hue}, 50%, 20%, 1)` : 'none',
			color: temp ? `hsl(${hue}, 20%, 20%)` : '#fff',
			outline: isSelected ? '5px solid #FFF' : 'none',
			fontWeight: isSelected ? 'bold' : 'normal',
		};
		return (
			<div style={style} className="demo-block">
				<div className="inner-block" style={innerStyle}>
					<Duration seconds={duration} />
				</div>
			</div>
		);
	}
}
