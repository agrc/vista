import React from 'react';
import { loadModules } from 'esri-loader';
import './Identify.css';
import config from './config';


let Graphic;
loadModules(['esri/Graphic']).then(([GraphicModule]) => Graphic = GraphicModule);


export default class PopupContent extends React.PureComponent {
  mapView = null;
  projection = null;
  contentContainerDiv = null;

  setView(value) {
    console.log('Identify:setView', value);

    this.mapView = value;
    this.mapView.popup.set({
      actions: [],
      title: 'Voter Location Information',
      content: this.tableNode
    });
  }

  onMapClick(event) {
    console.log('Identify:onMapClick', event);

    this.mapView.graphics.removeAll();
    this.mapView.graphics.add(new Graphic({
      geometry: event.mapPoint,
      symbol: config.symbols.IDENTIFY
    }));

    this.mapView.popup.open({
      location: event.mapPoint
    });

    let contentData = {};
    this.projectCoords(event.mapPoint).then(utmPoint => {
      contentData = {
        ...contentData,
        xCoord: Math.round(utmPoint.x * 100) / 100,
        yCoord: Math.round(utmPoint.y * 100) / 100
      };

      this.props.onIdentifyPropsChange(contentData);
    });
  }

  async projectCoords(mapPoint) {
    if (!this.projection) {
      [this.projection] = await loadModules(['esri/geometry/projection']);
      await this.projection.load();
    }

    return this.projection.project(mapPoint, { wkid: 3857 });
  }

  render() {
    return (
      <table className="popup-content" ref={table => this.tableNode = table}>
        <tbody>
          <tr>
            <td>X</td>
            <td>{this.props.xCoord}</td>
          </tr>
          <tr>
            <td>Y</td>
            <td>{this.props.yCoord}</td>
          </tr>
          <tr>
            <td>Precinct ID</td>
            <td>{this.props.precinctID}</td>
          </tr>
        </tbody>
      </table>
    );
  }
};
