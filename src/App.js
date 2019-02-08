import React, { Component } from 'react';
import MapLens from './components/MapLens';
import MapView from './components/esrijs/MapView';
import './App.css';

export default class App extends Component {
  state = {

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

    const sidebarOptions = {
      sideBarOpen: this.state.sideBarOpen,
      toggleSidebar: this.toggleSidebar
    }

    return (
      <div className="app">
        <MapLens {...sidebarOptions}>
          <MapView {...mapOptions} />
        </MapLens>
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
