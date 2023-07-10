const {FileFormatConverter, Record} = require('./FileFormatConverter');

const converter = new FileFormatConverter();

// Read XML file
converter.read('data.xml', 'xml');

// Edit record
converter.editRecord(0, { price: 40000 });

// Add new record
const newRecord = new Record('05.05.2023', 'Tesla Model S', 80000);
converter.addRecord(newRecord);

// Delete record
converter.deleteRecord(0);

// Convert to XML
const xmlData = converter.convertToXml();
console.log(xmlData);

// Convert to binary
const binaryData = converter.convertToBinary();
console.log(binaryData);
