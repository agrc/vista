import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { loadModules, loadCss } from 'esri-loader';
import { LayerSelectorContainer, LayerSelector } from '../../components/LayerSelector/LayerSelector';
import queryString from 'query-string';
import config from '../../config';
import fetchJsonp from 'fetch-jsonp';
import { loadProjection, projectCoords } from '../../helpers';


export const getInitialExtent = async (urlParams) => {
  let featureClassName;
  let predicate;
  const paramExists = param => param && param.length > 0;
  if (paramExists(urlParams.zip)) {
    featureClassName = config.featureClassNames.ZIP;
    predicate = `${config.fieldNames.ZIP5} = '${urlParams.zip}'`;
  } else if (paramExists(urlParams.precinctID)) {
    featureClassName = (paramExists(urlParams.map) && urlParams.map === 'p') ?
      config.featureClassNames.VISTA_BALLOT_AREAS : config.featureClassNames.VISTA_BALLOT_AREAS_PROPOSED;
    predicate = `${config.fieldNames.VistaID} = '${urlParams.precinctID}'`;
  } else if (paramExists(urlParams.county)) {
    featureClassName = config.featureClassNames.COUNTIES;
    predicate = `${config.fieldNames.COUNTYNBR} = '${formatCountyId(urlParams.county)}'`;
  } else {
    console.warn('No initial extent identified, zooming to the state of utah');

    return;
  }

  const webApiResponse = await fetch(`${config.urls.WEBAPI}/${featureClassName}/shape@envelope?${queryString.stringify({
    predicate,
    spatialReference: config.WEB_MERCATOR_WKID,
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
      'esri/geometry/Polygon',
      'esri/layers/MapImageLayer'
    ];
    const selectorRequires = [
      'esri/layers/support/LOD',
      'esri/layers/support/TileInfo',
      'esri/layers/WebTileLayer',
      'esri/Basemap'
    ];

    const [Map, MapView, Polygon, MapImageLayer, LOD, TileInfo, WebTileLayer, Basemap] = await loadModules(mapRequires.concat(selectorRequires));

    this.map = new Map();

    const urlParams = queryString.parse(document.location.search);

    if (urlParams.precinct === 'yes') {
      const layerProps = {
        url: config.urls.MAP_SERVICE,
        opacity: config.MAP_SERVICE_OPACITY
      };

      // show data form the VistaBalletAreas_Proposed layer
      if (urlParams.map && urlParams.map === 'p') {
        layerProps.sublayers = config.PROPOSED_LAYER_IDS.map(id => { return { id }; });
      }

      this.mapServiceLayer = new MapImageLayer(layerProps);
      this.map.add(this.mapServiceLayer);
    }

    this.view = new MapView({
      container: this.mapViewDiv,
      map: this.map,
      extent: {
        xmax: -11762120,
        xmin: -13074391,
        ymax: 5225035,
        ymin: 4373832,
        spatialReference: {
          wkid: config.WEB_MERCATOR_WKID
        }
      },
      ui: {
        components: ['zoom']
      }
    });

    this.props.setView(this.view);

    this.view.when(this.onMapLoaded.bind(this, urlParams));
    this.view.popup.set('actions', []);

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

    this.view.on('click', async event => {
      // don't fire if we hit a graphic
      if ((await this.view.hitTest(event)).results.length === 0) {
        this.props.onClick(event);
      }
    });

    const geometry = await getInitialExtent(urlParams);

    if (geometry) {
      this.zoomTo(new Polygon(geometry));
    }
  }

  async onMapLoaded(urlParams) {
    console.log('MapView:onMapLoaded', arguments);

    if (urlParams.query && urlParams.query.length > 0) {
      this.displayVistaQuery(urlParams.query, urlParams.db);
    }

    if (urlParams.currentX && urlParams.currentX.length > 0 && urlParams.currentY && urlParams.currentY.length > 0) {
      const projected = await projectCoords({
        x: parseFloat(urlParams.currentX, 10),
        y: parseFloat(urlParams.currentY, 10),
        spatialReference: { wkid: config.UTM_WKID }
      }, config.WEB_MERCATOR_WKID);

      const [Graphic] = await loadModules(['esri/Graphic']);

      this.view.graphics.add(new Graphic({
        geometry: projected,
        symbol: config.symbols.CURRENT
      }));
    }
  }

  async displayVistaQuery(queryNumber, db) {
    console.log('MapView:displayVistaQuery', arguments);

    const [GraphicsLayer, Graphic] = await loadModules(['esri/layers/GraphicsLayer', 'esri/Graphic']);

    const graphicsLayer = new GraphicsLayer();

    const hitTestForGraphic = async event => {
      const hitTest = await this.view.hitTest(event);
      let graphic;
      if (hitTest.results.length > 0) {
        hitTest.results.some(function(result) {
          if (result.graphic.layer === graphicsLayer) {
            graphic = result.graphic;

            return true;
          }

          return false;
        });
      }

      return graphic;
    };

    // user clicked on an existing graphic
    let lastSelectedGraphic;
    this.view.on('click', async event => {
      const graphic = await hitTestForGraphic(event);

      if (lastSelectedGraphic) {
        lastSelectedGraphic.set('symbol', config.symbols.RESIDENCE);
      }

      if (graphic && graphic.layer === graphicsLayer) {
        graphic.set('symbol', config.symbols.CURRENT);

        lastSelectedGraphic = graphic;

        const residenceID = graphic.attributes[config.fieldNames.ResidenceID];
        this.props.onVistaPointSelected({
          selectedID: residenceID,
          address: graphic.attributes[config.fieldNames.Address]
        });

        document.title = residenceID;
      }
    });

    // user moved over an existing graphic
    let highlightedGraphic;
    let highlightedPopupOpen;
    this.view.on('pointer-move', async event => {
      const graphic = await hitTestForGraphic(event);
      if (highlightedGraphic && highlightedGraphic !== lastSelectedGraphic) {
        highlightedGraphic.set('symbol', config.symbols.RESIDENCE);
        highlightedGraphic = null;
      }
      if (graphic) {
        this.view.popup.open({
          features: [graphic],
          location: graphic.geometry
        });

        if (graphic !== lastSelectedGraphic) {
          graphic.set('symbol', config.symbols.HIGHLIGHT);
          highlightedGraphic = graphic;
        }
        highlightedPopupOpen = true;
      } else if (highlightedPopupOpen) {
        this.view.popup.close();
        this.view.popup.clear();
        highlightedPopupOpen = false;
      }
    });

    const response = await fetchJsonp(`${config.urls.VISTA_SERVICE}${queryNumber}/?db=${db}`, {
      jsonpCallback: 'jsonp'
    });
    const responseJson = await response.json();

    if (responseJson.ResponseStatus !== 200) {
      throw new Error(`There was an error getting residence data from the Vista database! ${responseJson.ResponseMessage}`);
    }

    await loadProjection();
    const graphics = await Promise.all(responseJson.VResidences.map(res => {
      return projectCoords({
        type: 'point',
        x: res.X,
        y: res.Y,
        spatialReference: { wkid: config.UTM_WKID }
      }, config.WEB_MERCATOR_WKID).then(point => {
        return new Graphic({
          geometry: point,
          attributes: res,
          symbol: config.symbols.RESIDENCE,
          popupTemplate: {
            title: `{${config.fieldNames.Address}}`
          }
        });
      });
    }));

    graphicsLayer.addMany(graphics);
    this.map.add(graphicsLayer);
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
