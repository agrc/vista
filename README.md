# vista [![Build Status](https://travis-ci.com/agrc/vista.svg?branch=master)](https://travis-ci.com/agrc/vista)
A web app that is embedded within the Vista application


## Query Parameters
This application is configurable/controllable via URL query parameters.

### Initial Extent
The initial extent of the map is defined by one of three parameters. They are, in order of precedence: `zip`, `precinctID`, and `county`.

### URL Parameters
#### `zip`
A five digit zip code (e.g. `84124`) as defined by the `ZIP5` field within `SGID10.Boundaries.ZipCodes`.

#### `precinctID`
The precinct ID (e.g. `LA23:I-N-`) as defined by the `VistaID` field within `SGID10.Political.VistaBallotAreas`.

#### `county`
The county number (e.g. `9` or `15`) as defined by the `COUNTYNBR` field within `SGID10.Boundaries.Counties`.

#### `districts`
A switch (`yes` or `no`) that controls the visibility of political district data being displayed on map click popups and in the hidden form fields.

#### `precinct`
A switch (`yes` or `no`) that controls the visibility of the precinct data being displayed on map click popups and in the hidden form fields.

#### `map`
A switch (`c` (current), `p` (proposed)) for controlling the version of the precinct dataset. Current is `SGID10.Political.VistaBallotAreas` and proposed is `SGID10.Political.VistaBallotAreas_Proposed`. This effects the precinct layer that is drawn on the map in addition to the data shown in the popup and hidden form field.

#### `db`
A parameter that is passed on to the vista web service.

#### `query`
If this parameter is present, the app sends a request to the [vista web service](`src/config.js`) and displays the returned data as white points on the map.

#### `currentX` & `currentY`
If both of these coordinates (UTM) are present, then the application displays a blue dot at their location on the map.

#### `firebug`
A switch (`yes` or `no`) that controls weather [Firebug Lite](https://getfirebug.com/releases/lite/1.2/) is loaded in the page. This is helpful for debugging in a web control that doesn't have developer tools.

## Hidden Form Fields
There are several form input elements that are hidden. These provide a way for vista to read data from this app. Their element ids are: `XCoord`, `YCoord`, `Precinct`, `House`, `Senate`, `FedHouse`, `CountyID`, `selectedID`, and `Address`.

All element values are updated when a user clicks on the map (not on an existing point) except for `selectedID` and `Address`. `selectedID` and `Address` are updated when the user clicks on an existing white vista point. The document title is also update to reflect the same data as `selectedID` when an existing point is clicked.

## Moving Existing Points
When a user has selected an existing white vista point, if they click somewhere else on the map (not on another existing point), the point location is updated along with associated the hidden form fields.

## Development

Execute `npm start` to start a web server and view the website

Test Urls:
http://localhost:3000?precinctID=LA23:I-N-&precinct=yes&districts=no&currentX=423283.80&currentY=4549881.24&db=T&map=c&county=6
http://localhost:3000?precinctID=WJD015:00&precinct=yes&districts=no&currentX=420861.16&currentY=4497950.82&query=331035967&db=L&map=c&county=18

Execute `npm test` to run tests

### Build

Execute `npm run build` to create an optimized production build

_The files will be placed in `/build`_

Execute `serve -s build` to view the website

### Deploy

One-time tasks:

- [ ] Update the analytics code in `public/index.html`
- [ ] Create and populate `secrets.json` based on `secrets.sample.json`

Tasks to be completed for each release:

- [ ] Semantically update `.env` property `REACT_APP_VERSION`, `package.json`, `package-lock.json` versions
- [ ] Update `public/changelog.html`
- [ ] Verify all tests are passing (`npm test`)
- [ ] Run a build and test (`npm run build-prod`)
- [ ] Publish new version of map service (optional)
- [ ] Deploy website (`grunt deploy-prod`)
- [ ] Create release commit (`git commit -m 'chore: Release vx.x.x`)
- [ ] Create tag (`git tag vx.x.x`)
- [ ] Push commits and tag to github (`git push origin && git push origin --tags`)

### Notes

The current Vista servers are running Windows 7. When I tried upgrading the Esri JS API to 4.12, it caused a bug that prevented any point graphics from being displayed. So until the Vista server OSs are upgraded, the project needs to remain at 4.10.
