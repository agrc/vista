import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { loadModules, loadCss } from 'esri-loader';
import { LayerSelectorContainer, LayerSelector } from '../../components/LayerSelector/LayerSelector';
import queryString from 'query-string';
import config from '../../config';


export const getInitialExtent = async (urlParams) => {
  let featureClassName;
  let predicate;
  const paramExists = param => param && param.length > 0;
  if (paramExists(urlParams.zip)) {
    featureClassName = config.featureClassNames.ZIP;
    predicate = `${config.fieldNames.ZIP5} = '${urlParams.zip}'`;
  } else if (paramExists(urlParams.precinctID)) {
    featureClassName = config.featureClassNames.VISTA_BALLOT_AREAS;
    predicate = `${config.fieldNames.PrecinctID} = '${urlParams.precinctID}'`;
  } else if (paramExists(urlParams.county)) {
    featureClassName = config.featureClassNames.COUNTIES;
    predicate = `${config.fieldNames.COUNTYNBR} = '${formatCountyId(urlParams.county)}'`;
  } else {
    console.warn('No initial extent identified, zooming to the state of utah');

    return;
  }

  const webApiResponse = await fetch(`${config.urls.WEBAPI}/${featureClassName}/shape@envelope?${queryString.stringify({
    predicate,
    spatialReference: 3857,
    apiKey: process.env.REACT_APP_WEB_API
  })}`);

  const jsonResponse = await webApiResponse.json();

  return jsonResponse.result[0].geometry;
};

export const formatCountyId = id => {
  if (parseInt(id) < 10) {
    return `0${id}`;
  }

  return id;
};

export default class ReactMapView extends Component {
  zoomLevel = 5;
  displayedZoomGraphic = null;

  render() {
    return (
      <div
        style={{ height: '100%', width: '100%' }}
        ref={mapViewDiv => {
          this.mapViewDiv = mapViewDiv;
        }}
      />
    );
  }

  async componentDidMount() {
    loadCss('https://js.arcgis.com/4.10/esri/css/main.css');
    const mapRequires = [
      'esri/Map',
      'esri/views/MapView',
      'esri/geometry/Polygon'
    ];
    const selectorRequires = [
      'esri/layers/support/LOD',
      'esri/layers/support/TileInfo',
      'esri/layers/WebTileLayer',
      'esri/Basemap'
    ];

    const [Map, MapView, Polygon, LOD, TileInfo, WebTileLayer, Basemap] = await loadModules(mapRequires.concat(selectorRequires));

    this.map = new Map();

    this.view = new MapView({
      container: this.mapViewDiv,
      map: this.map,
      extent: {
        xmax: -11762120,
        xmin: -13074391,
        ymax: 5225035,
        ymin: 4373832,
        spatialReference: {
          wkid: 3857
        }
      },
      ui: {
        components: ['zoom']
      }
    });

    this.props.setView(this.view);

    const selectorNode = document.createElement('div');
    this.view.ui.add(selectorNode, 'top-right');

    const layerSelectorOptions = {
      view: this.view,
      quadWord: this.props.discoverKey,
      baseLayers: ['Hybrid', 'Lite', 'Terrain'],
      modules: [LOD, TileInfo, WebTileLayer, Basemap]
    }

    ReactDOM.render(
      <LayerSelectorContainer>
        <LayerSelector {...layerSelectorOptions}></LayerSelector>
      </LayerSelectorContainer>,
      selectorNode);

    this.view.on('click', this.props.onClick);

    const urlParams = queryString.parse(document.location.search);

    const geometry = await getInitialExtent(urlParams);

    if (geometry) {
      this.zoomTo(new Polygon(geometry));
    }
  }

  async zoomTo(zoomObj) {
    console.log('MapView:zoomTo', arguments);

    this.view.when(() => {
      this.view.goTo(zoomObj);
    });
  }

  getView() {
    return this.view;
  }
}
