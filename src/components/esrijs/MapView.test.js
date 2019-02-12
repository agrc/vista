import React from 'react';
import ReactDOM from 'react-dom';
import MapView, { getInitialExtent, formatCountyId } from './MapView';


describe('components/esrijs/MapView', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<MapView />, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  describe('getInitialExtent', () => {
    beforeEach(() => {
      fetch.resetMocks();
    });

    it('returns zip first, then precinct, then county', async () => {
      const allParams = {
        zip: 84124,
        precinctID: 'OPHIR',
        county: 29
      };
      const fakePolygon = { polygon: true };
      fetch.mockResponse(JSON.stringify({
        result: [{ geometry: fakePolygon }]
      }));

      const extent = await getInitialExtent({
        zip: '84124',
        precinctID: 'OPHIR',
        county: '29'
      });

      expect(extent).toEqual({ polygon: true });
      expect(fetch.mock.calls[0][0]).toMatch(/ZipCodes/);

      allParams.zip = '';

      await getInitialExtent({
        zip: '',
        precinctID: 'OPHIR',
        county: '29'
      });

      expect(fetch.mock.calls[1][0]).toMatch(/VistaBallotAreas/);

      await getInitialExtent({
        zip: '',
        precinctID: '',
        county: '29'
      });

      expect(fetch.mock.calls[2][0]).toMatch(/Counties/);
    });

    it('does not make a request if non of the parameters are present', async () => {
      await getInitialExtent({
        zip: '',
        precinctID: '',
        county: ''
      });

      expect(fetch).not.toBeCalled();
    });
  });

  describe('formatCountyId', () => {
    it('pads numbers less than 10 with a leading zero', () => {
      expect(formatCountyId('29')).toEqual('29');
      expect(formatCountyId('9')).toEqual('09');
    });
  });
});
