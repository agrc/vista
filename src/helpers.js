import { loadModules } from 'esri-loader';


let projection;
export const loadProjection = async function () {
  console.log('loading geometry engine...');
  [projection] = await loadModules(['esri/geometry/projection']);

  return projection.load();
}

export const projectCoords = async function(mapPoint) {
  if (!projection) {
    await loadProjection();
  }

  return projection.project(mapPoint, { wkid: 3857 });
}
