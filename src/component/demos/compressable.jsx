import { Component, Fragment } from 'react';
import Planner from 'component/demos/planner';
import commonData from 'data/common.json';

export default class CompressablePlanner extends Component {
	static defaultProps = {
		configs: [
			{ key: 'expanded', label: 'Expanded', tickWidth: 24, rowHeight: 62 },
			{ key: 'cozy', label: 'Cozy', tickWidth: 12, rowHeight: 48 },
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
						initialData={ commonData }
						rowHeight={rowHeight}
						tickWidth={tickWidth}
						/>
				</div>
			</Fragment>
		);
	}
}
