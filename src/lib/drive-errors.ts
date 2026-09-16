export class DriveError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "DriveError";
    this.status = status;
  }
}

export class DriveConfigError extends DriveError {
  constructor(message: string) {
    super(message, 500);
    this.name = "DriveConfigError";
  }
}

export class DriveInputError extends DriveError {
  constructor(message: string) {
    super(message, 400);
    this.name = "DriveInputError";
  }
}

export class DriveNotFoundError extends DriveError {
  constructor(message: string) {
    super(message, 404);
    this.name = "DriveNotFoundError";
  }
}

export class DriveConflictError extends DriveError {
  constructor(message: string) {
    super(message, 409);
    this.name = "DriveConflictError";
  }
}

export class DriveUpstreamError extends DriveError {
  constructor(message: string) {
    super(message, 502);
    this.name = "DriveUpstreamError";
  }
}
