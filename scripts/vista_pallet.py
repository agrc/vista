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

        self.sgid = join(self.garage, 'SGID.sde')

        self.political = join(self.staging_rack, 'political.gdb')

        self.copy_data = [self.political]

    def build(self, config):
        self.add_crates(['VistaBallotAreas',
                         'VistaBallotAreas_Proposed'],
                        {'source_workspace': self.sgid,
                         'destination_workspace': self.political})
