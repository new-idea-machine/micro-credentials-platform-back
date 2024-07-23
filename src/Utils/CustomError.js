export class CustomError extends Error {
  constructor(message, name, status_code) {
    super(message);
    this.name = name;
    this.status_code = status_code;
  }
}
