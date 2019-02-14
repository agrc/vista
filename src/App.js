import React, { Component } from 'react';
import MapLens from './components/MapLens';
import MapView from './components/esrijs/MapView';
import Identify from './Identify';
import './App.css';


console.info('app version: ', process.env.REACT_APP_VERSION);

const emptyState = {
  xCoord: '',
  yCoord: '',
  precinct: '',
  house: '',
  senate: '',
  fedHouse: '',
  countyID: '',
  selectedID: '',
  address: ''
};

export default class App extends Component {
  state = {
    ...emptyState,
    selectedGraphic: null
  };

  handleIdentifyPropsChange(props) {
    console.log('App:handleIdentifyPropsChange', arguments);

    if (props) {
      this.setState(props);
    } else {
      this.setState(emptyState);
    }
  }

  render() {
    const quadWord = process.env.REACT_APP_DISCOVER;

    const mapOptions = {
      discoverKey: quadWord,
      zoomToGraphic: this.state.zoomToGraphic,
      onClick: event => this.identify.onMapClick(event),
      setView: view => this.identify.setView(view),
      onVistaPointSelected: event => this.setState(event)
    }

    return (
      <div className="app">
        <MapLens>
          <MapView {...mapOptions} />
        </MapLens>
        <form style={{ display: 'none' }}>
          <input id="XCoord" value={this.state.xCoord} type="text" readOnly />
          <input id="YCoord" value={this.state.yCoord} type="text" readOnly />
          <input id="Precinct" value={this.state.precinct} type="text" readOnly />
          <input id="House" value={this.state.house} type="text" readOnly />
          <input id="Senate" value={this.state.senate} type="text" readOnly />
          <input id="FedHouse" value={this.state.fedHouse} type="text" readOnly />
          <input id="CountyID" value={this.state.countyID} type="text" readOnly />
          <input id="selectedID" value={this.state.selectedID} type="text" readOnly />
          <input id="Address" value={this.state.address} type="text" readOnly />
        </form>
        <Identify {...this.state} onIdentifyPropsChange={this.handleIdentifyPropsChange.bind(this)}
          ref={identify => this.identify = identify}/>
      </div>
    );
  }
}
