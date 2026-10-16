/** An error that becomes an HTTP answer: `throw new HttpError(404, 'no such slide')`. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
