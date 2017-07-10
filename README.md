# vista
Web app that is embedded in the Vista application

### Installation
1. Publish `maps/Vista.mxd` as `Vista` map service.

### URL Parameters
`currentX`/`currentY`  
Display a point on the map as a blue graphic.

`precincts`(yes | no)  
Show "Precinct ID:" data in popup window and associated map layer.

`districts`(yes | no)  
Show political districts in popup window.

`map`(c | p)  
Switch between current (c) or proposed (p) precinct boundaries.

`zip`  
The zip code that you want to zoom to.

`precinctID`  
The precinct that you want to zoom to.

`county`(number)  
The county number that you want to zoom to (e.g. `6`).

Zoom precedence: `zip` -> `precinctID` -> `county`

#### Parameters that are passed through to the vista web service request
`db`(string)
Passed through as the `db` route to the vista web service.

`displayMode`(string)  
Passed through as the `displaymode` parameter to the vista web service. This is also the trigger for making a request to the web service. If there is no value passed to this parameter then the app makes no request.

`residenceID` (number)  
Passed through as the `residenceid` parameter to the vista web service.

In addition, `precinctID` and `county` are also passed.

Web service call template: `https://services-vista.at.utah.gov/data/api/agrc/address/{db}/{county}?displaymode={displayMode}&precinctid={precinctID}&residenceid={residenceID}`

[Vista Web Service Docs](https://docs.google.com/a/utah.gov/spreadsheets/d/1tkfhs0sc_km3AK8cEdGar7_8oUWX1DAvxytNfmfRTLY/edit?usp=sharing)

### Demo URLs
http://mapserv.utah.gov/vista/?&countyid=6&currentX=416455.44&currentY=4501579.28&db=t&displayMode=onstreet&districts=no&map=c&precinctID=TAY034:00&precincts=yes&residenceID=178879626
