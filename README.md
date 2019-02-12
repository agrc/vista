# vista
A web app that is embedded within the Vista application


## Query Parameters
This application is configurable/controllable via URL query parameters.

### Initial Extent
The initial extent of the map is defined by one of three parameters. They are, in order of precedence: `zip`, `precinctID`, and `county`.

### URL Parameters
#### `zip`
A five digit zip code (e.g. `84124`) as defined by the `ZIP5` field within `SGID10.Boundaries.ZipCodes`.

#### `precinctID`
The precinct ID (e.g. `LA23`) as defined by the `PrecinctID` field within `SGID10.Political.VistaBallotAreas`.

#### `county`
The county number (e.g. `9` or `15`) as defined by the `COUNTYNBR` field within `SGID10.Boundaries.Counties`.


### Test URLs
http://localhost:3000?precinctID=LA23&precinct=yes&districts=no&currentX=423283.80&currentY=4549881.24&db=T&map=c&county=6
