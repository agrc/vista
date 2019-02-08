import arcpy
import sys
import requests
import math


VISTABALLOTAREAS = r'Database Connections\SGID10.sde\SGID10.POLITICAL.VistaBallotAreas'
RESIDENCES = r'C:\Temp\Temp.gdb\Residences'
PRECINCTS = r'X:\Projects\vista\scripts\vista_prod.odc\GV_VISTA.PRECINCTS'
RESIDENCES_SOURCE = r'X:\Projects\vista\scripts\vista_prod.odc\GV_VISTA.RESIDENCES'
COUNTIES = r'Database Connections\SGID10.sde\SGID10.BOUNDARIES.Counties'
API_KEY = 'AGRC-ABA1A9E9631070'
errors = []
counties = {}


def process_county(id):
    print('Processing County: {}'.format(counties[id]))
    if len(precinct) > 0:
        print('Precinct: {}'.format(precinct))

    residences_layer = arcpy.MakeFeatureLayer_management(RESIDENCES, 'residences_layer', 'COUNTY_ID = {}'.format(id))

    arcpy.AddJoin_management(residences_layer, 'PRECINCT_ID', PRECINCTS, 'PRECINCT_ID')

    fields = ['RESIDENCE_ID', 'X', 'Y', 'SL_SNUMBER', 'SL_DIRECTION_PREFIX', 'SL_STREET', 'SL_DIRECTION_SUFFIX', 'SL_TYPE', 'SL_ZIP']
    for res_id, vista_x, vista_y, snum, prefix, street, suffix, stype, szip in arcpy.da.SearchCursor(residences_layer, fields, 'PRECINCTS.PRECINCT = {}'.format(precinct)):
        address = ' '.join([snum, prefix, street, suffix, stype]).replace('  ', ' ')
        r = requests.get('http://api.mapserv.utah.gov/api/v1/geocode/{}/{}'.format(address, szip), params={'apiKey': API_KEY})
        response = r.json()
        if r.status_code is not 200 or response['status'] is not 200:
            print('no match found for res id: {} ({})'.format(res_id, address))
            continue

        geocoded_point = response['result']['location']

        distance = math.hypot(geocoded_point['x'] - vista_x, geocoded_point['y'] - vista_y)

        if distance > 50:
            print('possibly incorrectly geocoded res id: {}, distance: {}'.format(res_id, distance))

    arcpy.Delete_management(residences_layer)


try:
    county_id = sys.argv[1]
except IndexError:
    county_id = raw_input('county id (leave blank to run all): ')

try:
    refresh_residences = sys.argv[2] == 'Y'
except IndexError:
    refresh_residences = raw_input('refresh residence data from vista (Y/N)? ') == 'Y'

try:
    precinct = sys.argv[3]
except IndexError:
    precinct = raw_input('precinct id (MID017:01, leave blank to run all): ')

if refresh_residences:
    print('pulling new residence data from vista database...')
    if arcpy.Exists(RESIDENCES):
        arcpy.Delete_management(RESIDENCES)
    print('making query table...')
    xy_table = arcpy.MakeQueryTable_management([RESIDENCES_SOURCE], 'xy_table', 'USE_KEY_FIELDS', 'GV_VISTA.RESIDENCES.RESIDENCE_ID')
    print('making xy event layer...')
    xy_layer = arcpy.MakeXYEventLayer_management(xy_table, 'X', 'Y', 'xy_layer', arcpy.SpatialReference(26912))
    print('copying features ...')
    arcpy.CopyFeatures_management(xy_layer, RESIDENCES)

for row in arcpy.da.SearchCursor(COUNTIES, ['COUNTYNBR', 'NAME']):
    counties[int(row[0])] = row[1]

if len(county_id) > 0:
    process_county(int(county_id))
else:
    for id in counties.keys():
        process_county(id)

for error in errors:
    print(error)
