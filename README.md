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

`db`(L | T | S | D)  
Determines which vista database is used.  
Production/Live = L  
Test = T  
Staging (AT) = S  
Development = D  

`streetid` (number)  
Parameter passed to the `SP_AGRC_PLOT_STREET`

`map`(c | p)  
Switch between current (c) or proposed (p) precinct boundaries.

`zip`  
The zip code that you want to zoom to.

`precinctID`  
The precinct that you want to zoom to.

`county`(number)  
The county number that you want to zoom to (e.g. `6`) or the `county_id` parameter for the stored procedures.

`diff`(t)  
If this parameter is present then the `SP_AGRC_PLOT_DIFF_PRECINCT` is run rather than the non-diff version.

Zoom type precedence: `zip` -> `precinctID` -> `county`

### Stored Procedures
This application executes stored procedures in the vista database under the following conditions.

`SP_AGRC_PLOT_STREET` - This requires `street_name_id` (e.g. 155275890) and `county_id` (e.g. 18)  
`SP_AGRC_PLOT_PRECINCT` - This requires `precinct` (e.g. 'KRN005:00') and `county_id` (e.g. 18)  
`SP_AGRC_PLOT_DIFF_PRECINCT` - This requires `precinct` (e.g. 'KRN005:00') and `county_id` (e.g. 18). This only fires when `diff=t` in the URL params.

Example that will execute the `SP_AGRC_PLOT_STREET` procedure:  
http://mapserv.utah.gov/havaaddressfix?precinct=yes&districts=no&currentX=416455.44&currentY=4501579.28&streetid=155275890&db=T&map=c&county=18

Example that will execute the `SP_AGRC_PLOT_PRECINCT` procedure:  
http://mapserv.utah.gov/havaaddressfix?precinctID=KRN005:00&precinct=yes&districts=no&currentX=416455.44&currentY=4501579.28&db=T&map=c&county=18

Example that will execute the `SP_AGRC_PLOT_DIFF_PRECINCT` procedure:  
http://mapserv.utah.gov/havaaddressfix?precinctID=KRN005:00&precinct=yes&districts=no&currentX=416455.44&currentY=4501579.28&diff=t&db=T&map=c&county=18
