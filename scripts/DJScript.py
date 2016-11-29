import arcpy
import sys
import pyodbc
import datetime

# field names
X_fld = 'X'
Y_fld = 'Y'
PRECINCT_ID_fld = 'PRECINCT_ID'
COUNTY_ID_fld = 'COUNTY_ID'
RESIDENCE_ID_fld = 'RESIDENCE_ID'
VistaID_fld = 'VistaID'

try:
    db = sys.argv[1]
    db_username = sys.argv[2]
    db_password = sys.argv[3]
    db_server = sys.argv[4]
    county_num = sys.argv[5]
    res_id = sys.argv[6]
except IndexError:
    db = raw_input('Database Instance (e.g. test, live, dev, etc..): ')
    db_username = raw_input('Database Username: ')
    db_password = raw_input('Database Password: ')
    db_server = raw_input('Database Server:Port/ServiceName: ')
    county_num = raw_input('County Number: ')
    res_id = raw_input('Residence ID: ')

log_file_location = r'\\<machine name>\v1\Apps\VISTA\Working Directory\Services\ResidencePrecinctUpdate' + r'\\' + county_num+ '_' + db + '_' + datetime.datetime.now().strftime("%Y%m%d") + '.log'
ResCounty_file_location = r'\\<machine name>\v1\Apps\VISTA\Working Directory\Services\ResidencePrecinctUpdate' + r'\\' + county_num + '_' + db + '_Residence-County_Issues' + '_' + datetime.datetime.now().strftime("%Y%m%d") + '.log'

with open(log_file_location, "a+") as log_file:
    log_file.write("Beginning process - " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")  + " \n")

    counties = r'SGID10.sde\SGID10.BOUNDARIES.Counties'
    vista_ballot_areas = r'SGID10.sde\SGID10.POLITICAL.VistaBallotAreas'
    precincts_table = r'vista_' + db + '.odc\GV_VISTA.PRECINCTS'
    residences_table = r'vista_' + db + '.odc\GV_VISTA.RESIDENCES'

    print('Running GIS update process.')
    log_file.write('Running GIS update process. \n')
    #print('Making temporary Residences table view.')
    log_file.write('Making temporary Residences table view. \n')
    query = '{} = {}'.format(COUNTY_ID_fld, county_num)
    resquery = query + ' AND ' + '{} IN ({})'.format(RESIDENCE_ID_fld, res_id)
    xy_table = arcpy.MakeQueryTable_management([residences_table], 'xy_table', 'USE_KEY_FIELDS', 'GV_VISTA.RESIDENCES.RESIDENCE_ID', where_clause=resquery)
    log_file.write('Query: ' + resquery + " \n")

    #print('Setting precinct name to id')
    log_file.write('Setting precinct name to id \n')
    precinct_table = arcpy.MakeQueryTable_management([precincts_table], 'precinct_table', 'USE_KEY_FIELDS', 'GV_VISTA.PRECINCTS.PRECINCT_ID', where_clause=query)
    precinct_name_to_id = {}
    with arcpy.da.SearchCursor(precinct_table, [PRECINCT_ID_fld, 'PRECINCT']) as scur:
        for row in scur:
            if row[0] is not None:
                if row[0] > 0:
                    log_file.write('   Setting ' + str(row[1]) + ' to ' + str(row[0]) + ' \n')
                    precinct_name_to_id[row[1]] = row[0]
                else:
                    log_file.write('   Cannot set ' + str(row[0]) + ' to ' + str(row[0]) + ' \n')
            else:
                log_file.write('   Setting NONE to ' + str(row[0]) + ' \n')

    print('Creating the [XY] layer')
    log_file.write('Creating the [XY] layer \n')
    xy_layer = arcpy.MakeXYEventLayer_management(xy_table, X_fld, Y_fld, 'xy_layer', arcpy.SpatialReference(26912))

    print('Setting GIS identity')
    log_file.write('Setting GIS identity for counties. \n')
    identityCounties = arcpy.Identity_analysis(xy_layer, counties, 'in_memory\identity_counties')

    i = 0
    print("Validating Residnce and County IDs.")
    log_file.write('Validating Residnce and County IDs. \n')
    with open(ResCounty_file_location, "a+") as ResCounty_file:
        with arcpy.da.SearchCursor(identityCounties, ['COUNTYNBR', COUNTY_ID_fld, RESIDENCE_ID_fld]) as cur:
            for row in cur:
                if row[0] is not None:
                    resID = str(row[2])
                    countyID = str(row[0])
                    if countyID.startswith('0'):
                        countyID = countyID.replace('0','')
                    if countyID != '':
                        gisCountyID = str(row[1]).replace('.0','')
                        if countyID != gisCountyID:
                            print('Residence ID [' + resID + '] belongs to County ['+ countyID + ']' + ' - GIS County [' + gisCountyID + '].')
                            log_file.write('Residence ID [' + resID + '] belongs to County ['+ countyID + '] \n')
                            ResCounty_file.write('Residence ID [' + resID + '] belongs to County ['+ countyID + '] \n')
                            i = i + 1
                    else:
                            print('Residence ID [' + resID + '] has invalid X and/or Y coordinates.')
                            log_file.write('Residence ID [' + resID + '] has invalid X and/or Y coordinates. \n')
                            ResCounty_file.write('Residence ID [' + resID + '] has invalid X and/or Y coordinates. \n')
                            i = i + 1
    ResCounty_file.close()

    if i == 0:
        print('Setting GIS identity')
        log_file.write('Setting GIS identity for vista ballot areas. \n')
        identity = arcpy.Identity_analysis(xy_layer, vista_ballot_areas, 'in_memory\identity')

        print('Building GIS Residence to Precinct Mapping table.')
        log_file.write('Building GIS Residence to Precinct Mapping table. \n')
        res_to_precinct_dict = {}
        with arcpy.da.SearchCursor(identity, [RESIDENCE_ID_fld, VistaID_fld]) as scur:
            for row in scur:
                if row[1] is not None:
                    if str(row[1]) <> '':
                        log_file.write('   Mapping ' + str(row[0]) + ' to ' + str(row[1]) + ' \n')
                        res_to_precinct_dict[row[0]] = row[1]
                    else:
                         log_file.write('   Cannot map ' + str(row[0]) + ' to ' + str(row[1]) + ' \n')
                else:
                     log_file.write('   Mapping NONE to ' + str(row[0]) + ' \n')


        print('Updating Precinct IDs')
        log_file.write('Updating VISTA Database \n')
        with arcpy.da.SearchCursor(xy_table, [RESIDENCE_ID_fld]) as cur:
            connection = pyodbc.connect('Driver={Microsoft ODBC for Oracle};UID=' + db_username + ';PWD=' + db_password + ';SERVER='+ db_server)
            cursor = connection.cursor()
            for row in cur:
                log_file.write(' \n')
                if row[0] is not None:
                    log_file.write('Residence ID: ' + str(row[0]) + ' \n')
                    if row[0] > 0:
                        res_statement = """
                            SELECT PRECINCT_ID, COUNTY_ID
                            FROM GV_VISTA.RESIDENCES
                            WHERE RESIDENCE_ID = {}
                            AND COUNTY_ID = {}
                            """.format(row[0],county_num)
                        log_file.write('   Query: ' + str(res_statement) + ' \n')
                        res_rows = cursor.execute(res_statement).fetchone()
                        if res_rows:
                            if str(county_num) == str(res_rows.COUNTY_ID):
                                log_file.write('   Updating Precinct ID: \n')
                                log_file.write('      Old: ' + str(res_rows.PRECINCT_ID) + ' \n')
                                try:
                                    new_precinct_id = precinct_name_to_id[res_to_precinct_dict[row[0]]]
                                except KeyError as error:
                                    print('ERROR: issue with res id: {}. error: {}'.format(row[0], error) + ' \n')
                                    log_file.write('ERROR: issue with res id: {}. \n       Message: {}'.format(row[0], error) + ' \n')
                                    continue
                                log_file.write('      New: ' + str(new_precinct_id) + ' \n')
                                statement = """
                                    UPDATE GV_VISTA.RESIDENCES
                                    SET PRECINCT_ID = {}
                                    WHERE RESIDENCE_ID = {}
                                    """.format(new_precinct_id, row[0])
                                log_file.write('   Query: ' + str(statement) + ' \n')
                                cursor.execute(statement)
                                connection.commit()
                                log_file.write('   Commit Successful \n')
                                log_file.write('   Recording only changes to repository \n')
                                if res_rows.PRECINCT_ID != new_precinct_id:
                                    evr_connection = pyodbc.connect('Driver={Microsoft ODBC for Oracle};UID=GV_EVR;PWD=<password>;SERVER=<server>:1521/tgvdv')
                                    evr_cursor = evr_connection.cursor()
                                    evr_statement = """INSERT INTO GV_EVR.RESIDENCE_CHANGE_DETAILS
                                                        (KEY,TABLE_NAME,FIELD_NAME,TRIGGERED_ACTION,FROM_VALUE,TO_VALUE,CHANGED_BY,RESIDENCE_ID)
                                                        VALUES({},'RESIDENCES','PRECINCT_ID','INSERT',{},{},'VISTA.Services.Residence.PrecinctUpdate',{})""".format(row[0],res_rows.PRECINCT_ID,new_precinct_id,row[0])
                                    evr_cursor.execute(evr_statement)
                                    log_file.write('   Query: ' + str(statement) + ' \n')
                                    evr_connection.commit()
                                    log_file.write('   Commit Successful. \n')
                            else:
                                print('Residence ID [' + str(row[0]) + '] belongs to County ['+ str(res_rows.COUNTY_ID) + ']')
                                log_file.write('Residence ID [' + str(row[0]) + '] belongs to County ['+ str(res_rows.COUNTY_ID) + '] \n')
                                with open(ResCounty_file_location, "a+") as ResCounty_file2:
                                    ResCounty_file2.write('Residence ID [' + str(row[0]) + '] belongs to County ['+ str(res_rows.COUNTY_ID) + '] \n')
                                    ResCounty_file2.close()
                        else:
                            print('Residence ID not found in VISTA.')
                            log_file.write('Residence ID not found in VISTA. \n')
                    else:
                        print('Residence ID not found in VISTA. \n')
                        log_file.write('Residence ID not found in VISTA. \n')
                else:
                    print("No rows to update \n")
                    log_file.write("No rows to update \n")
    else:
         log_file.write("County and residence validation issues. \n")

    log_file.write("Ending process - " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") +" \n")
    log_file.close()
    print('*** Precinct IDs updated for this batch. ***')
    print(' ')
    print(' ')
