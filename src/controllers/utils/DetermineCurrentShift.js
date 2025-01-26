const moment = require('moment-timezone');

exports.determineCurrentShift = () => {
    const now = moment.tz('America/Vancouver'); 
    
    // Shift boundaries in Vancouver time
    const dayShiftStart = now.clone().set({ hour: 6, minute: 30, second: 0, millisecond: 0 });
    const nightShiftStart = now.clone().set({ hour: 18, minute: 30, second: 0, millisecond: 0 });

    let shiftType;
    let shiftDate = now.clone().startOf('day'); 

    // Determine if it's Day Shift or Night Shift
    if (now.isBetween(dayShiftStart, nightShiftStart)) {
        shiftType = "Day Shift";
    } else {
        shiftType = "Night Shift";
        if (now.isBefore(dayShiftStart)) {
            shiftDate.subtract(1, 'day');
        }
    }

    return {
        date: shiftDate.format('YYYY-MM-DD'),
        shiftType,
    };
};