import arcpy

# data
counties = r'SGID10.sde\SGID10.BOUNDARIES.Counties'
precincts_table = r'vista_dev.odc\GV_VISTA.PRECINCTS'
residences_table = r'vista_dev.odc\GV_VISTA.RESIDENCES'

# field names
X_fld = 'X'
Y_fld = 'Y'
PRECINCT_ID_fld = 'PRECINCT_ID'
COUNTY_ID_fld = 'COUNTY_ID'
RESIDENCE_ID_fld = 'RESIDENCE_ID'
VistaID_fld = 'VistaID'


print('making table view')
res_query = '{} > 1 AND {} > 1'.format(X_fld, Y_fld)
xy_table = arcpy.MakeQueryTable_management([residences_table], 'xy_table', 'USE_KEY_FIELDS', 'GV_VISTA.RESIDENCES.RESIDENCE_ID', where_clause=res_query)

print('making precincts look up dictionary')
precinct_table = arcpy.MakeQueryTable_management([precincts_table], 'precinct_table', 'USE_KEY_FIELDS', 'GV_VISTA.PRECINCTS.PRECINCT_ID')
precinct_name_to_id = {}
with arcpy.da.SearchCursor(precinct_table, [PRECINCT_ID_fld, 'PRECINCT']) as scur:
    for row in scur:
        precinct_name_to_id[row[1]] = row[0]

print('making xy layer')
xy_layer = arcpy.MakeXYEventLayer_management(xy_table, X_fld, Y_fld, 'xy_layer', arcpy.SpatialReference(26912))

print('doing identity')
identity = arcpy.Identity_analysis(xy_layer, counties, 'in_memory\identity')

with arcpy.da.SearchCursor(identity, ['COUNTYNBR', COUNTY_ID_fld, RESIDENCE_ID_fld]) as cur:
    for row in cur:
        if row[0] != row[1]:
            print(row[2])
