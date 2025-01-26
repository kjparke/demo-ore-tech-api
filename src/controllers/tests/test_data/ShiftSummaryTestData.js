exports.mockEvents = [
    { _id: 'event1', unitId: '6100' },
    { _id: 'event2', unitId: '6200' },
    { _id: 'event3', unitId: '6300' },
    { _id: 'event4', unitId: '6400' },
    { _id: 'event5', unitId: '6500' },
  ];

exports.mockDeltas = [
    { _id: 'delta1', eventId: 'event1', startTime: '2024-05-28T10:00:00.000Z', endTime: '2024-05-28T12:00:00.000Z', status: 'down_waiting', secondaryStatus: 'maintenance' },
    { _id: 'delta2', eventId: 'event1', startTime: '2024-05-28T12:00:00.000Z', endTime: '2024-05-28T13:00:00.000Z', status: 'down_unscheduled', secondaryStatus: 'repair' },
    { _id: 'delta3', eventId: 'event2', startTime: '2024-05-28T09:00:00.000Z', endTime: '2024-05-28T10:00:00.000Z', status: 'down_scheduled', secondaryStatus: 'maintenance' },
    { _id: 'delta4', eventId: 'event2', startTime: '2024-05-28T11:00:00.000Z', endTime: '2024-05-28T12:00:00.000Z', status: 'down_waiting', secondaryStatus: 'repair' },
    { _id: 'delta5', eventId: 'event3', startTime: '2024-05-28T10:00:00.000Z', endTime: '2024-05-28T11:00:00.000Z', status: 'down_waiting', secondaryStatus: 'inspection' },
    { _id: 'delta6', eventId: 'event3', startTime: '2024-05-28T11:00:00.000Z', endTime: '2024-05-28T12:00:00.000Z', status: 'down_waiting', secondaryStatus: 'repair' },
    { _id: 'delta7', eventId: 'event4', startTime: '2024-05-28T08:00:00.000Z', endTime: '2024-05-28T09:00:00.000Z', status: 'down_scheduled', secondaryStatus: 'inspection' },
    { _id: 'delta8', eventId: 'event4', startTime: '2024-05-28T09:00:00.000Z', endTime: '2024-05-28T10:00:00.000Z', status: 'down_unscheduled', secondaryStatus: 'repair' },
    { _id: 'delta9', eventId: 'event5', startTime: '2024-05-28T07:00:00.000Z', endTime: '2024-05-28T08:00:00.000Z', status: 'down_unscheduled', secondaryStatus: 'maintenance' },
    { _id: 'delta10', eventId: 'event5', startTime: '2024-05-28T08:00:00.000Z', endTime: '2024-05-28T09:00:00.000Z', status: 'down_scheduled', secondaryStatus: 'inspection' },
    { _id: 'delta11', eventId: 'event5', startTime: '2024-05-28T09:00:00.000Z', endTime: '2024-05-28T10:00:00.000Z', status: 'down_unscheduled', secondaryStatus: 'repair' },
  ];