exports.calculateTimeInStatus = (date) => {
  const createdAtDate = new Date(date);
  const currentDate = new Date();

  // Convert both dates to UTC
  const createdAtDateUTC = Date.UTC(
    createdAtDate.getFullYear(),
    createdAtDate.getMonth(),
    createdAtDate.getDate(),
    createdAtDate.getHours(),
    createdAtDate.getMinutes(),
    createdAtDate.getSeconds()
  );
  const currentDateUTC = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    currentDate.getHours(),
    currentDate.getMinutes(),
    currentDate.getSeconds()
  );

  // Calculate the difference in milliseconds
  const differenceInTime = currentDateUTC - createdAtDateUTC;

  // Convert the difference to hours and round down
  const differenceInHours = Math.floor(differenceInTime / (1000 * 3600));

  return `${differenceInHours} hours`;
};