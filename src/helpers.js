import { loadModules } from 'esri-loader';


let projection;
export const loadProjection = async function () {
  if (!projection) {
    console.log('loading geometry engine...');
    [projection] = await loadModules(['esri/geometry/projection']);

    return projection.load();
  }
}

export const projectCoords = async function(mapPoint, wkid) {
  if (!projection) {
    await loadProjection();
  }

  return projection.project(mapPoint, { wkid });
}
