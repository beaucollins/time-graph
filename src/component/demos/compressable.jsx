import { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Planner from 'component/demos/planner';

export default class CompressablePlanner extends Component {
	static propTypes = {
		configs: PropTypes.arrayOf(PropTypes.shape({
			key: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
			tickWidth: PropTypes.number.isRequired,
			rowHeight: PropTypes.number.isRequired,
		})).isRequired,
	};

	static defaultProps = {
		configs: [
			{ key: 'expanded', label: 'Expanded', tickWidth: 24, rowHeight: 48 },
			{ key: 'cozy', label: 'Cozy', tickWidth: 14, rowHeight: 32 },
		],
	};

	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		return { selectedOption: nextProps.configs[0] };
	}

	selectItem = item => () => {
		this.setState({ selectedOption: item });
	}

	renderMenuItem = item => {
		const { selectedOption } = this.state;
		return (
			<li
				key={item.key}
				className={selectedOption === item ? 'selected' : '' }
				onClick={this.selectItem(item)}
			>
				{item.label}
			</li>
		);
	}

	renderMenu() {
		return (
			<menu>
				{this.props.configs.map(this.renderMenuItem)}
			</menu>
		);
	}

	render() {
		const { selectedOption } = this.state;
		const { rowHeight, tickWidth } = selectedOption;
		return (
			<Fragment>
				{this.renderMenu()}
				<div id="graph-container">
					<Planner
						initialData={ this.props.initialData }
						rowHeight={rowHeight}
						tickWidth={tickWidth}
						/>
				</div>
			</Fragment>
		);
	}
}
