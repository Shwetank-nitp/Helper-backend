class ErrorResponse extends Error {
  constructor(status, message = "SYSErr", code) {
    super("CLI_ERR");
    this.status = status;
    this.code = code;
    this.message = message;
    this.stack = Error.captureStackTrace(this, this.constructor);
  }

  getMessage() {
    const data = {
      status: this.status,
      code: this.code,
      message: this.message,
    };
    console.log({ ...data, stack: this.stack });
    return data;
  }
}

export { ErrorResponse };
