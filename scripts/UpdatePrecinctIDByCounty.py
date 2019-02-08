import arcpy
import sys
import pyodbc
import secrets

# data
vista_ballot_areas = r'SGID10.sde\SGID10.POLITICAL.VistaBallotAreas'
precincts_table = r'vista_dev.odc\GV_VISTA.PRECINCTS'
residences_table = r'vista_dev.odc\GV_VISTA.RESIDENCES'

# field names
X_fld = 'X'
Y_fld = 'Y'
PRECINCT_ID_fld = 'PRECINCT_ID'
COUNTY_ID_fld = 'COUNTY_ID'
RESIDENCE_ID_fld = 'RESIDENCE_ID'
VistaID_fld = 'VistaID'

try:
    county_num = sys.argv[1]
except IndexError:
    county_num = raw_input('County Number: ')

print('making table view')
county_query = '{} = {}'.format(COUNTY_ID_fld, county_num)
res_query = '{} AND {} > 1 AND {} > 1'.format(county_query, X_fld, Y_fld)
xy_table = arcpy.MakeQueryTable_management([residences_table], 'xy_table', 'USE_KEY_FIELDS', 'GV_VISTA.RESIDENCES.RESIDENCE_ID', where_clause=res_query)

print('making precincts look up dictionary')
precinct_table = arcpy.MakeQueryTable_management([precincts_table], 'precinct_table', 'USE_KEY_FIELDS', 'GV_VISTA.PRECINCTS.PRECINCT_ID', where_clause=county_query)
precinct_name_to_id = {}
with arcpy.da.SearchCursor(precinct_table, [PRECINCT_ID_fld, 'PRECINCT']) as scur:
    for row in scur:
        precinct_name_to_id[row[1]] = row[0]

print('making xy layer')
xy_layer = arcpy.MakeXYEventLayer_management(xy_table, X_fld, Y_fld, 'xy_layer', arcpy.SpatialReference(26912))

print('doing identity')
identity = arcpy.Identity_analysis(xy_layer, vista_ballot_areas, 'in_memory\identity')

print('building res_to_precinct_dict')
res_to_precinct_dict = {}
with arcpy.da.SearchCursor(identity, [RESIDENCE_ID_fld, VistaID_fld]) as scur:
    for row in scur:
        res_to_precinct_dict[row[0]] = row[1]

print('updating precinct ids')
with arcpy.da.SearchCursor(xy_table, [RESIDENCE_ID_fld]) as cur:
    connection = pyodbc.connect('Driver={Microsoft ODBC for Oracle};UID={};PWD={};SERVER={}'.format(secrets.USERNAME, secrets.PASSWORD, secrets.SERVER))
    cursor = connection.cursor()
    i = 0
    for row in cur:
        i = i + 1
        try:
            new_precinct_id = precinct_name_to_id[res_to_precinct_dict[row[0]]]
        except KeyError as error:
            print('problem with res id: {}. {}'.format(row[0], error))
            continue
        statement = """
            update GV_VISTA.RESIDENCES
            set PRECINCT_ID = {}
            where RESIDENCE_ID = {}
            """.format(new_precinct_id, row[0])
        # print(statement)
        cursor.execute(statement)
        connection.commit()

print('done: {}'.format(i))
