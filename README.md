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


## Development

Execute `npm start` to start a web server and view the website

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

- [ ] Semantically update `.env` property `REACT_APP_VERSION` and `package.json` version
- [ ] Update `public/changelog.html`
- [ ] Verify all tests are passing (`npm test`)
- [ ] Run a build and test (`npm run build-prod`)
- [ ] Deploy website (`grunt deploy-prod`)
- [ ] Create release commit (`git commit -m 'chore: Release vx.x.x`)
- [ ] Create tag (`git tag vx.x.x`)
- [ ] Push commits and tag to github (`git push origin && git push origin --tags`)
