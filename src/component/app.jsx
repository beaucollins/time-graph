import { Component } from 'react';
import PropTypes from 'prop-types';

import Planner from 'component/demos/planner';
import CompressablePlanner from 'component/demos/compressable';
import AvailabilityPlanner from 'component/demos/availability';

import './app.scss';
import maxData from 'data/max.json';
import commonData from 'data/common.json';

export default class App extends Component {

	static propTypes = {
		options: PropTypes.arrayOf(PropTypes.shape({
			key: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
			render: PropTypes.func.isRequired,
		})).isRequired
	}

	static defaultProps = {
		options: [
			{ key: 'availability', label: 'Availability', render: () => {
				return <div id="graph-container"><AvailabilityPlanner /></div>;
			} },
			{ key: 'empty', label: 'Empty', render: () => {
				return <CompressablePlanner initialData={[]} />;
			} },
			{ key: 'common', label: 'Common', render: () => {
				return <CompressablePlanner initialData={ commonData } />;
			} },
			{ key: 'max', label: 'Max Data', render: () => {
				return <CompressablePlanner initialData={ maxData } />;
			} },
		],
	};

	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		if (!prevState.selectedOption) {
			return { selectedOption: nextProps.options[0] };
		}
	}

	selectItem = item => () => {
		this.setState({ selectedOption: item });
	}

	renderMenuItem = item => {
		const {selectedOption} = this.state;
		return (
			<li onClick={this.selectItem(item)} className={ item === selectedOption ? 'selected' : '' } key={item.key}>{item.label}</li>
		);
	}

	renderMenu() {
		return (
			<menu>
			{this.props.options.map(this.renderMenuItem)}
			</menu>
		);
	}

	render() {
		const { selectedOption } = this.state;
		return (
			<div id="demo">
				<div id="demo-chrome">
					{this.renderMenu(selectedOption)}
				</div>
				{selectedOption.render()}
			</div>
		);
	}
}