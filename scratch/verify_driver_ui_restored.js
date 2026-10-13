const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    const checks = [
      'id="driverDashboardScreen"',
      'class="driver-top-header"',
      'id="driverDashSearchInput"',
      'id="driverDutyToggle"',
      'id="driverDashClockTime"',
      'id="driverGreetingHeader"',
      'id="driverMapStageCard"',
      'id="driverCockpitMap"',
      'id="driverRouteGlassTitle"',
      'id="driverRouteTrackFill"',
      'id="driverScheduleRowsContainer"',
      'id="driverActivityRowsContainer"',
      'id="driverNextTripTargetStop"',
      'id="driverUpcomingStopsContainer"',
      'id="btnContinueTripAction"',
      'id="driverPassengersModal"',
      'id="driverEarningsModal"',
      'id="driverEndTripModal"',
      'id="driverSwitchRouteModal"',
      'id="driverIncidentModal"',
      'id="driverSettingsModal"',
      'id="driverModal_preTrip"',
      'id="driverModal_qrScanner"',
      'id="driverModal_seatConfig"',
      'id="driverModal_profile"'
    ];

    let passed = 0;
    checks.forEach(c => {
      if (data.includes(c)) {
        passed++;
      } else {
        console.error('MISSING:', c);
      }
    });

    console.log(`Passed ${passed} / ${checks.length} HTML checks!`);
    if (passed === checks.length) {
      console.log('ALL DRIVER SCREENS AND ELEMENTS PRESENT IN INDEX.HTML!');
    }
  });
}).on('error', err => {
  console.error('Request error:', err);
});
