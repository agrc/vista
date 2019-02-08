import arcpy
import sys


VISTABALLOTAREAS = r'Database Connections\SGID10.sde\SGID10.POLITICAL.VistaBallotAreas'
RESIDENCES = r'C:\Temp\Temp.gdb\Residences'
PRECINCTS = r'X:\Projects\vista\scripts\vista_prod.odc\GV_VISTA.PRECINCTS'
RESIDENCES_SOURCE = r'X:\Projects\vista\scripts\vista_prod.odc\GV_VISTA.RESIDENCES'
COUNTIES = r'Database Connections\SGID10.sde\SGID10.BOUNDARIES.Counties'
errors = []
counties = {}


def process_county(id):
    print('Processing County: {}'.format(counties[id]))

    precincts_layer = arcpy.MakeFeatureLayer_management(VISTABALLOTAREAS, 'precincts_layer', 'CountyID = {}'.format(id))
    residences_layer = arcpy.MakeFeatureLayer_management(RESIDENCES, 'residences_layer', 'COUNTY_ID = {}'.format(id))

    arcpy.AddJoin_management(residences_layer, 'PRECINCT_ID', PRECINCTS, 'PRECINCT_ID')
    precinct_ids = [row[0] for row in arcpy.da.SearchCursor(precincts_layer, ['VistaID'])]
    i = 0
    for precinct_id in precinct_ids:
        i += 1
        print('{} | {} out of {} | {} County'.format(precinct_id, i, len(precinct_ids), counties[id]))
        arcpy.SelectLayerByAttribute_management(precincts_layer, 'NEW_SELECTION', 'VistaID = \'{}\''.format(precinct_id))
        arcpy.SelectLayerByLocation_management(residences_layer, 'INTERSECT', precincts_layer, selection_type='NEW_SELECTION')
        with arcpy.da.SearchCursor(residences_layer, ['Residences.RESIDENCE_ID', 'PRECINCT'], 'PRECINCT <> \'{}\''.format(precinct_id)) as cursor:
            for row in cursor:
                msg = '{}: error with res id: {}, should be {} but it\'s {}.'.format(counties[id], row[0], precinct_id, row[1])
                errors.append(msg)
                print(msg)

    arcpy.Delete_management(precincts_layer)
    arcpy.Delete_management(residences_layer)


try:
    county_id = sys.argv[1]
except IndexError:
    county_id = raw_input('county id (leave blank to run all): ')

try:
    refresh_residences = sys.argv[2] == 'Y'
except IndexError:
    refresh_residences = raw_input('refresh residence data from vista (Y/N)? ') == 'Y'

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
