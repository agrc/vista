#!/usr/bin/env python
# * coding: utf8 *
'''
vista_pallet.py

A module that contains a forklift pallet definition for the vista project.
'''

from forklift.models import Pallet
from os.path import join


class VistaPallet(Pallet):
    def __init__(self):
        super(VistaPallet, self).__init__()

        self.arcgis_services = [('Vista', 'MapServer')]

        self.staging = r'C:\Scheduled\staging'
        self.sgid = join(self.garage, 'SGID10.sde')

        self.political = join(self.staging, 'political.gdb')
        self.boundaries = join(self.staging, 'boundaries.gdb')
        self.cadastre = join(self.staging, 'cadastre.gdb')
        self.location = join(self.staging, 'location.gdb')

        self.copy_data = [self.political,
                          self.boundaries,
                          self.cadastre,
                          self.location]

    def build(self, config):
        self.add_crates(['UtahHouseDistricts2012',
                         'UtahSenateDistricts2012',
                         'USCongressDistricts2012',
                         'VistaBallotAreas',
                         'VistaBallotAreas_Proposed'],
                        {'source_workspace': self.sgid,
                         'destination_workspace': self.political})
        self.add_crates(['ZipCodes',
                         'Counties'],
                        {'source_workspace': self.sgid,
                         'destination_workspace': self.boundaries})
        self.add_crates(['Parcels_Beaver', 'Parcels_BoxElder', 'Parcels_Cache', 'Parcels_Carbon', 'Parcels_Daggett', 'Parcels_Davis', 'Parcels_Duchesne',
                         'Parcels_Emery', 'Parcels_Garfield', 'Parcels_Grand', 'Parcels_Iron', 'Parcels_Juab', 'Parcels_Kane', 'Parcels_Millard',
                         'Parcels_Morgan', 'Parcels_Piute', 'Parcels_Rich', 'Parcels_SaltLake', 'Parcels_SanJuan', 'Parcels_Sanpete', 'Parcels_Sevier',
                         'Parcels_Summit', 'Parcels_Tooele', 'Parcels_Uintah', 'Parcels_Utah', 'Parcels_Wasatch', 'Parcels_Washington', 'Parcels_Wayne',
                         'Parcels_Weber'],
                        {'source_workspace': self.sgid,
                         'destination_workspace': self.cadastre})
        self.add_crate(('AddressPoints', self.sgid, self.location))
