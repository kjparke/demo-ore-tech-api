const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

exports.convertToCSV = (data, fields) => {
  try {
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    
    return csv;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

exports.printCSV = (data, fields, filename) => {
  try {
    const csv = this.convertToCSV(data, fields);
    const filePath = path.join(__dirname, "../../../public", filename);

    // Ensure the directory exists
    const directoryPath = path.dirname(filePath);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Write the CSV file
    fs.writeFileSync(filePath, csv, { encoding: "utf8" });
    console.log(`CSV file successfully created at: ${filePath}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};