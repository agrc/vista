import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { loadModules, loadCss } from '../../esri-loader/esri-loader';
import { LayerSelectorContainer, LayerSelector } from '../../components/LayerSelector/LayerSelector';
import queryString from 'query-string';
import config from '../../config';
import fetchJsonp from 'fetch-jsonp';
import proj4 from 'proj4';


export const getInitialExtent = async (urlParams) => {
  let featureClassName;
  let predicate;
  const paramExists = param => param && param.length > 0;
  if (paramExists(urlParams.zip)) {
    featureClassName = config.featureClassNames.ZIP;
    predicate = `${config.fieldNames.ZIP5} = '${urlParams.zip}'`;
  } else if (paramExists(urlParams.precinctID)) {
    featureClassName = (paramExists(urlParams.map) && urlParams.map === 'p') ?
      config.featureClassNames.VISTA_BALLOT_AREAS_PROPOSED : config.featureClassNames.VISTA_BALLOT_AREAS;
    predicate = `${config.fieldNames.VistaID} = '${urlParams.precinctID}'`;
    if (paramExists(urlParams.county)) {
      predicate = `${predicate} AND ${config.fieldNames.CountyID} = ${urlParams.county}`;
    }
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
    loadCss();

    const mapRequires = [
      'esri/Map',
      'esri/views/MapView',
      'esri/geometry/Polygon',
      'esri/layers/FeatureLayer',
      'esri/layers/VectorTileLayer'
    ];
    const selectorRequires = [
      'esri/layers/support/LOD',
      'esri/layers/support/TileInfo',
      'esri/layers/WebTileLayer',
      'esri/Basemap'
    ];

    const [Map, MapView, Polygon, FeatureLayer, VectorTileLayer, LOD, TileInfo, WebTileLayer, Basemap] =
      await loadModules(mapRequires.concat(selectorRequires), config.ESRI_LOADER_OPTIONS);

    this.map = new Map();

    const urlParams = queryString.parse(document.location.search);

    this.map.add(new VectorTileLayer({
      minScale: config.LABELS_MIN_SCALE,
      style: {
        version: 8,
        sources: {
          esri: {
            type: 'vector',
            url: config.urls.PARCELS
          }
        },
        layers: [
          {
            id: 'StateWideParcels',
            type: 'line',
            source: 'esri',
            'source-layer': 'StateWideParcels',
            minzoom: 10.95,
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 2
            }
          }
        ]
      }
    }));

    this.map.add(new FeatureLayer({
      url: config.urls.ADDRESS_POINTS,
      minScale: config.LABELS_MIN_SCALE,
      labelingInfo: [{
        labelExpressionInfo: {
          expression: `$feature.${config.fieldNames.AddNum}`
        },
        // the property below can be removed at Esri JS 4.12+
        symbol: {
          type: "text",
          color: "white",
          haloSize: 1,
          haloColor: "black"
        }
      }],
      renderer: {
        type: 'simple'
      }
    }));

    this.map.add(new FeatureLayer({
      url: config.urls.ROADS,
      minScale: config.LABELS_MIN_SCALE,
      labelingInfo: [{
        labelExpressionInfo: {
          expression: `$feature.${config.fieldNames.FULLNAME}`
        },
        labelPlacement: 'center-along',
        // the property below can be removed at Esri JS 4.12+
        symbol: {
          type: "text",
          color: "white",
          haloSize: 1,
          haloColor: "black"
        }
      }],
      renderer: {
        type: 'simple'
      }
    }));

    if (urlParams.precinct === 'yes') {
      const layerIndex = (urlParams.map && urlParams.map === 'p') ? 1 : 0;
      const layerProps = {
        url: `${config.urls.MAP_SERVICE}/${layerIndex}`
      };

      this.map.add(new FeatureLayer(layerProps));
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
      baseLayers: ['Imagery', 'Lite', 'Terrain'],
      modules: [LOD, TileInfo, WebTileLayer, Basemap]
    }

    ReactDOM.render(
      <LayerSelectorContainer>
        <LayerSelector {...layerSelectorOptions}></LayerSelector>
      </LayerSelectorContainer>,
      selectorNode);

    this.view.on('click', async event => {
      this.view.graphics.removeAll();

      // don't fire if we hit a point
      const hitTest = await this.view.hitTest(event);
      if (hitTest.results.length === 0 || hitTest.results.every(result => result.graphic.layer !== this.graphicsLayer)) {
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

    const [GraphicsLayer, Graphic] = await loadModules(['esri/layers/GraphicsLayer', 'esri/Graphic'], config.ESRI_LOADER_OPTIONS);

    this.graphicsLayer = new GraphicsLayer();
    this.map.add(this.graphicsLayer);

    let currentPoint;
    if (urlParams.currentX && urlParams.currentX.length > 0 && urlParams.currentY && urlParams.currentY.length > 0) {
      currentPoint = {
        x: parseFloat(urlParams.currentX, 10),
        y: parseFloat(urlParams.currentY, 10)
      }
    }

    if (urlParams.query && urlParams.query.length > 0) {
      this.displayVistaQuery(urlParams.query, urlParams.db, currentPoint);
    } else if (currentPoint) {
      const projected = proj4(config.UTM_WKT, config.WEB_MERCATOR_WKT, currentPoint);

      this.graphicsLayer.add(new Graphic({
        geometry: {
          type: 'point',
          ...projected,
          spatialReference: config.WEB_MERCATOR_WKID
        },
        symbol: config.symbols.CURRENT
      }));
      console.log('currentPoint graphic added');
    }
  }

  async displayVistaQuery(queryNumber, db, currentPoint) {
    console.log('MapView:displayVistaQuery', arguments);

    const [Graphic] = await loadModules(['esri/Graphic'], config.ESRI_LOADER_OPTIONS);

    const hitTestForGraphic = async event => {
      const hitTest = await this.view.hitTest(event);
      let graphic;
      if (hitTest.results.length > 0) {
        hitTest.results.some(result => {
          if (result.graphic.layer === this.graphicsLayer) {
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

      if (graphic && graphic.layer === this.graphicsLayer) {
        graphic.set('symbol', config.symbols.CURRENT);

        lastSelectedGraphic = graphic;

        const residenceID = graphic.attributes[config.fieldNames.ResidenceID];
        this.props.onVistaPointSelected({
          selectedID: residenceID,
          address: graphic.attributes[config.fieldNames.Address],
          selectedGraphic: graphic
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

    const graphics = responseJson.VResidences.map(res => {
      const point = proj4(config.UTM_WKT, config.WEB_MERCATOR_WKT, {
        x: res.X,
        y: res.Y
      });

      const graphic = new Graphic({
        geometry: {
          type: 'point',
          ...point,
          spatialReference: { wkid: config.WEB_MERCATOR_WKID }
        },
        attributes: res,
        symbol: config.symbols.RESIDENCE,
        popupTemplate: {
          title: `{${config.fieldNames.Address}}`
        }
      });

      if (res.X === currentPoint.x && res.Y === currentPoint.y) {
        graphic.set('symbol', config.symbols.CURRENT);
        lastSelectedGraphic = graphic;
      }

      return graphic;
    });

    this.graphicsLayer.addMany(graphics);
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
