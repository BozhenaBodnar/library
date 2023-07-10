const fs = require('fs');
const xml2js = require('xml2js');

class Record {
  constructor(date, brandName, price) {
    this.date = date;
    this.brandName = brandName;
    this.price = price;
  }
}

class FileFormatConverter {
  constructor() {
    this.records = [];
  }

  read(file, format) {
    if (format === 'xml') {
      this.readXmlFile(file);
    } else if (format === 'binary') {
      this.readBinaryFile(file);
    } else {
      throw new Error('Unsupported file format.');
    }
  }

  readXmlFile(file) {
    const xmlData = fs.readFileSync(file, 'utf-8');
    xml2js.parseString(xmlData, (err, result) => {
      if (err) {
        throw new Error('Error parsing XML file.');
      }
      const cars = result.Document.Car;
      if (cars) {
        for (const car of cars) {
          const date = car.Date[0];
          const brandName = car.BrandName[0];
          const price = parseInt(car.Price[0]);
          this.records.push(new Record(date, brandName, price));
        }
      }
    });
  }

  readBinaryFile(file) {
    const buffer = fs.readFileSync(file);
    const recordsCount = buffer.readInt32LE(2); // Assuming little-endian encoding
    let offset = 6; // Start after header
    for (let i = 0; i < recordsCount; i++) {
      const date = buffer.slice(offset, offset + 8).toString('utf8');
      offset += 8;
      const brandNameLength = buffer.readInt16LE(offset);
      offset += 2;
      const brandName = buffer.slice(offset, offset + brandNameLength * 2).toString('utf16le');
      offset += brandNameLength * 2;
      const price = buffer.readInt32LE(offset);
      offset += 4;
      this.records.push(new Record(date, brandName, price));
    }
  }

  editRecord(index, newData) {
    if (index >= 0 && index < this.records.length) {
      this.records[index] = { ...this.records[index], ...newData };
    } else {
      throw new Error('Invalid record index.');
    }
  }

  addRecord(record) {
    this.records.push(record);
  }

  deleteRecord(index) {
    if (index >= 0 && index < this.records.length) {
      this.records.splice(index, 1);
    } else {
      throw new Error('Invalid record index.');
    }
  }

  convertToXml() {
    const builder = new xml2js.Builder();
    const xmlObj = {
      Document: {
        Car: this.records.map((record) => ({
          Date: record.date,
          BrandName: record.brandName,
          Price: record.price.toString(),
        })),
      },
    };
    return builder.buildObject(xmlObj);
  }

  convertToBinary() {
    const recordsCount = this.records.length;
    let maxBrandNameLength = 0;
    for (const record of this.records) {
      const brandNameLength = Buffer.byteLength(record.brandName, 'utf16le') / 2;
      maxBrandNameLength = Math.max(maxBrandNameLength, brandNameLength);
    }
    const bufferSize = 6 + recordsCount * (14 + maxBrandNameLength * 2);
    const buffer = Buffer.alloc(bufferSize);
    buffer.writeInt16LE(0x2526, 0); // Header
    buffer.writeInt32LE(recordsCount, 2); // Records count
    let offset = 6; // Start after header
    for (let i = 0; i < recordsCount; i++) {
      const record = this.records[i];
      buffer.write(record.date, offset, 8, 'utf8');
      offset += 8;
      const brandNameLength = Buffer.byteLength(record.brandName, 'utf16le') / 2;
      buffer.writeInt16LE(brandNameLength, offset);
      offset += 2;
      buffer.write(record.brandName, offset, brandNameLength * 2, 'utf16le');
      offset += brandNameLength * 2;
      buffer.writeInt32LE(record.price, offset);
      offset += 4;
    }
    return buffer;  
  }
}

module.exports = {FileFormatConverter, Record};


