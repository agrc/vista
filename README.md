# vista
Web app that is embedded in the Vista application

### Installation
1. Publish `maps/Vista.mxd` as `Vista` map service.

### URL Parameters
`currentX`/`currentY`  
Display a point on the map as a blue graphic.

`precinct`(yes | no)  
Show "Precinct ID:" data in popup window and associated map layer.

`districts`(yes | no)  
Show political districts in popup window.

`db`(T | ?)  
Parameter passed to the vistaservice web service.

`query`
Parameter passed to the vistaservice web service.

`map`(c | p)  
Switch between current (c) or proposed (p) precinct boundaries.

`zip`
The zip code that you want to zoom to.

`precinctID`
The precinct that you want to zoom to.

`county`(number)  
The county number that you want to zoom to (e.g. `6`).

Zoom type precedence: `zip` -> `precinctID` -> `county`
