import React, { Component } from 'react';
import MapLens from './components/MapLens';
import MapView from './components/esrijs/MapView';
import './App.css';

export default class App extends Component {
  state = {
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

  onMapClick = this.onMapClick.bind(this);
  setView = this.setView.bind(this);

  render() {
    const quadWord = process.env.REACT_APP_DISCOVER;

    const mapOptions = {
      discoverKey: quadWord,
      zoomToGraphic: this.state.zoomToGraphic,
      onClick: this.onMapClick,
      setView: this.setView
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
      </div>
    );
  }

  onMapClick(event) {
    console.log('onMapClick', event);
  }

  setView(value) {
    this.setState({
      mapView: value
    });
  }
}
