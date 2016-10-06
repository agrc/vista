import arcpy

# data
counties = r'SGID10.sde\SGID10.BOUNDARIES.Counties'
sgid_precincts = r'SGID10.sde\SGID10.POLITICAL.VistaBallotAreas'
precincts_table = r'vista_dev.odc\GV_VISTA.PRECINCTS'
residences_table = r'vista_dev.odc\GV_VISTA.RESIDENCES'
residence_points = r'C:\Temp\Temp.gdb\ResidencePoints'

# field names
X_fld = 'X'
Y_fld = 'Y'
PRECINCT_ID_fld = 'PRECINCT_ID'
COUNTY_ID_fld = 'COUNTY_ID'
RESIDENCE_ID_fld = 'RESIDENCE_ID'
VistaID_fld = 'VistaID'

# print('making table view')
# res_query = '{} > 1 AND {} > 1'.format(X_fld, Y_fld)
# xy_table = arcpy.MakeQueryTable_management([residences_table], 'xy_table', 'USE_KEY_FIELDS', 'GV_VISTA.RESIDENCES.RESIDENCE_ID', where_clause=res_query)
#
# print('making precincts look up dictionary')
# precinct_table = arcpy.MakeQueryTable_management([precincts_table], 'precinct_table', 'USE_KEY_FIELDS', 'GV_VISTA.PRECINCTS.PRECINCT_ID')
# precinct_name_to_id = {}
# with arcpy.da.SearchCursor(precinct_table, [PRECINCT_ID_fld, 'PRECINCT']) as scur:
#     for row in scur:
#         precinct_name_to_id[row[1]] = row[0]

# print('making xy layer')
# xy_layer = arcpy.MakeXYEventLayer_management(xy_table, X_fld, Y_fld, 'xy_layer', arcpy.SpatialReference(26912))

print('doing identity')
identity = r'C:\Temp\Temp.gdb\ResidenceIdentity'
if arcpy.Exists(identity):
    arcpy.Delete_management(identity)
identity = arcpy.Identity_analysis(residence_points, sgid_precincts, identity)

print('search cursoring')
with arcpy.da.SearchCursor(identity, ['PRECINCT', VistaID_fld, RESIDENCE_ID_fld]) as cur:
    i = 0
    for row in cur:
        if row[0] != row[1]:
            i = i + 1
            print('ID: {}, {} should be {}'.format(row[2], row[0], row[1]))

    print('total errors: {}'.format(i))
