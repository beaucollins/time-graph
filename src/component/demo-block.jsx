import { PureComponent } from 'react';
import PropTypes from 'prop-types';

const colors = {
	a: 0,
	b: 128,
	c: 255,
};

const DEFAULT_HUE = 26;

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
		const { isSelected, type, duration } = props;
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
			background: props.temp ? `hsla(${hue}, 10%, 50%, 0.75)` : `hsl(${hue}, 20%, 50%)`,
			borderRadius: 2,
			border: props.temp ? `1px solid hsla(${hue}, 10%, 50%, 1)` : 'none',
			color: '#fff',
			outline: isSelected ? '5px solid #FFF' : 'none',
			fontWeight: isSelected ? 'bold' : 'normal',
		};
		return (
			<div style={style}>
				<div className="inner-block" style={innerStyle}>
				<div>{duration && Math.ceil(duration / 60)}</div>
				</div>
			</div>
		);
	}
}
