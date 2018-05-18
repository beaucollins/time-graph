import { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class Block extends PureComponent {
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		y: PropTypes.number.isRequired,
	};

	render() {
		const props = this.props;
		const style = {
			width: props.width,
			height: props.height,
			left: props.x,
			top: props.y,
			outline: '1px dotted #F00',
			position: 'absolute',
		};
		return (
			<div style={style}></div>
		);
	}
}
