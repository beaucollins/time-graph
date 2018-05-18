import { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class DemoBlock extends PureComponent {
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		y: PropTypes.number.isRequired,
		temp: PropTypes.bool,
	};

	static defaultProps = {
		temp: false,
	};

	render() {
		const props = this.props;
		const { isSelected } = props;
		const style = {
			width: props.width,
			height: props.height,
			left: props.x,
			top: props.y,
			position: 'absolute',
		};
		const innerStyle = {
			position: 'absolute',
			top: 8,
			bottom: 8,
			left: 2,
			right: 2,
			background: props.temp ? 'hsla(255, 10%, 50%, 0.5)' : 'hsl(255, 10%, 50%)',
		};
		return (
			<div style={style}>
				<div className="inner-block" style={innerStyle}><div>{isSelected ? 'selected' : '' }</div></div>
			</div>
		);
	}
}
