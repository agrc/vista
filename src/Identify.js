import React from 'react';
import { loadModules } from 'esri-loader';
import './Identify.css';
import config from './config';
import queryString from 'query-string';


let Graphic;
loadModules(['esri/Graphic']).then(([GraphicModule]) => Graphic = GraphicModule);

const urlParams = queryString.parse(document.location.search);

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
    this.props.onIdentifyPropsChange(false);

    this.mapView.graphics.add(new Graphic({
      geometry: event.mapPoint,
      symbol: config.symbols.IDENTIFY
    }));

    this.mapView.popup.open({
      location: event.mapPoint
    });

    this.projectCoords(event.mapPoint).then(utmPoint => {
      this.props.onIdentifyPropsChange({
        xCoord: Math.round(utmPoint.x * 100) / 100,
        yCoord: Math.round(utmPoint.y * 100) / 100
      });
    });

    if (urlParams.precinct && urlParams.precinct === 'yes') {
      this.getSGIDValue(config.featureClassNames.VISTA_BALLOT_AREAS,
                        config.fieldNames.PrecinctID,
                        event.mapPoint,
                        'precinct');
      this.getSGIDValue(config.featureClassNames.VISTA_BALLOT_AREAS,
                        config.fieldNames.CountyID,
                        event.mapPoint,
                        'countyID');
    }

    if (urlParams.districts && urlParams.districts === 'yes') {
      [[config.featureClassNames.UTAH_HOUSE, config.fieldNames.DIST, event.mapPoint, 'house'],
       [config.featureClassNames.UTAH_SENATE, config.fieldNames.DIST, event.mapPoint, 'senate'],
       [config.featureClassNames.US_CONGRESS, config.fieldNames.DISTRICT, event.mapPoint, 'fedHouse']]
       .forEach(queryInfo => this.getSGIDValue(...queryInfo));
    }
  }

  async getSGIDValue(featureClass, field, point, key) {
    console.log('Identify:getSGIDValue');

    const response = await fetch(`${config.urls.WEBAPI}/${featureClass}/${field}?${queryString.stringify({
      apiKey: process.env.REACT_APP_WEB_API,
      attributeStyle: 'identical',
      geometry: `point:${JSON.stringify(point.toJSON())}`
    })}`);

    const jsonResponse = await response.json();

    this.props.onIdentifyPropsChange({ [key]: jsonResponse.result[0].attributes[field].toString() });
  }

  async projectCoords(mapPoint) {
    if (!this.projection) {
      [this.projection] = await loadModules(['esri/geometry/projection']);
      await this.projection.load();
    }

    return this.projection.project(mapPoint, { wkid: 3857 });
  }

  render() {
    const rows = [{
      label: 'X',
      prop: 'xCoord'
    }, {
      label: 'Y',
      prop: 'yCoord'
    }, {
      label: 'Precinct ID',
      prop: 'precinct'
    }, {
      label: 'State House',
      prop: 'house'
    }, {
      label: 'State Senate',
      prop: 'senate'
    }, {
      label: 'U.S. House',
      prop: 'fedHouse'
    }, {
      label: 'County ID',
      prop: 'countyID'
    }];
    return (
      <table className="popup-content" ref={table => this.tableNode = table}>
        <tbody>
          {rows.filter(row => this.props[row.prop].toString().length > 0).map(row => {
            return <tr key={row.prop}>
              <td>{row.label}</td>
              <td>{this.props[row.prop]}</td>
            </tr>;
          })}
        </tbody>
      </table>
    );
  }
};
