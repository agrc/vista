import React from 'react';
import { loadModules } from 'esri-loader';
import './Identify.css';
import config from './config';
import queryString from 'query-string';
import { projectCoords } from './helpers';


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
      actions: [],
      title: 'Voter Location Information',
      content: this.tableNode,
      location: event.mapPoint
    });

    projectCoords(event.mapPoint, config.UTM_WKID).then(utmPoint => {
      this.props.onIdentifyPropsChange({
        xCoord: Math.round(utmPoint.x * 100) / 100,
        yCoord: Math.round(utmPoint.y * 100) / 100
      });
    });

    if (urlParams.precinct && urlParams.precinct === 'yes') {
      const vistaFCName = (urlParams.map === 'p') ? config.featureClassNames.VISTA_BALLOT_AREAS : config.featureClassNames.VISTA_BALLOT_AREAS_PROPOSED;
      this.getSGIDValue(vistaFCName,
                        config.fieldNames.PrecinctID,
                        event.mapPoint,
                        'precinct');
      this.getSGIDValue(vistaFCName,
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
