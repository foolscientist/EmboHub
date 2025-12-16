export default class PrettyFileSize {
  size: number;
  unit: string;
  sizeBytes: number;

  constructor(fileSizeInBytes: number) {
    this.sizeBytes = fileSizeInBytes;
    if (fileSizeInBytes < 1024) {
      this.size = fileSizeInBytes;
      this.unit = "B";
    } else if (fileSizeInBytes < Math.pow(1024, 2)) {
      this.size = fileSizeInBytes / 1024;
      this.unit = "KB";
    } else if (fileSizeInBytes < Math.pow(1024, 3)) {
      this.size = fileSizeInBytes / Math.pow(1024, 2);
      this.unit = "MB";
    } else {
      this.size = fileSizeInBytes / Math.pow(1024, 3);
      this.unit = "GB";
    }
  }

  toString(): string {
    return this.size.toFixed(2) + " " + this.unit;
  }
  static fromBytes(sizeBytes: number) {
    return new PrettyFileSize(sizeBytes);
  }
}
