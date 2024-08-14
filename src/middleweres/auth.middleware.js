import { ErrorResponse } from "../utils/ErrorResponse.js";
import jwt from "jsonwebtoken";

const { JsonWebTokenError } = jwt;

function auth(req, res, next) {
  const token = req.cookies["health_auth_token"]; // Access cookies from req

  if (!token) {
    return next(new ErrorResponse(false, "No token found in cookies", 404));
  }

  const signature = process.env.SIGNATURE_TOKEN;

  if (!signature) {
    return next(
      new ErrorResponse(
        false,
        { message: "No signature found in environment variables" },
        500
      )
    );
  }

  try {
    const res = jwt.verify(token, signature, { complete: true });
    req.userId = res.payload.userId;
    return next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return next(new ErrorResponse(false, { message: error.message }, 401)); // Use 401 for unauthorized
    }
    return next(
      new ErrorResponse(
        false,
        { message: "An error occurred during token verification" },
        500
      )
    );
  }
}

export { auth };
