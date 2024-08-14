import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Users } from "../models/User.model.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { SuccessResponse } from "../utils/SuccessResponse.js";
import { google } from "googleapis";

let tokens = undefined;

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  String(process.env.GOOGLE_CLIENT_ID),
  String(process.env.GOOGLE_CLIENT_SECRET),
  String(process.env.GOOGLE_REDIRECT_URIS)
);

// Middleware to check and set OAuth2 credentials
const authMiddle = asyncHandler(async (req, res, next) => {
  try {
    console.log(tokens);
    if (tokens) {
      oauth2Client.setCredentials(tokens);
      next();
    } else {
      res.redirect(process.env.GOOGLE_REDIRECT_URIS);
    }
  } catch (error) {
    next(error);
  }
});

// Route to generate authentication URL
const authToken = (req, res, next) => {
  try {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/gmail.send"],
    });
    res.redirect(authorizeUrl);
  } catch (error) {
    next(error);
  }
};

// OAuth2 callback route
const oauthCallback = asyncHandler(async (req, res, next) => {
  const { code } = req.query;
  try {
    const { tokens: scope_token } = await oauth2Client.getToken(code);
    tokens = scope_token;
    oauth2Client.setCredentials(tokens);
    res.redirect("http://localhost:8080/api/v1/auth/sendmailconf");
  } catch (error) {
    next(error);
  }
});

// Function to create the email body in base64 encoded format
function makeBody(to, subject, message) {
  const str = [
    `Content-Type: text/plain; charset="UTF-8"\n`,
    `MIME-Version: 1.0\n`,
    `Content-Transfer-Encoding: 7bit\n`,
    `to: ${to}\n`,
    `from: ${process.env.GMAIL_USER}\n`,
    `subject: ${subject}\n\n`,
    message,
  ].join("");

  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Route to send email
const sendMail = asyncHandler(async (req, res) => {
  if (!req.session.tokens) {
    return res
      .status(401)
      .send(new ErrorResponse("User not authenticated", 401));
  }
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  console.log("userID: ", req.userId);
  //const { userId } = req.query;
  const userId = "66b610de2619e7cd06a099f2";
  console.log("req user -mailer final destination : ", req.userId);
  const signature = process.env.SIGNATURE_TOKEN;
  const user = await Users.findById(userId);

  if (!user) {
    throw new ErrorResponse(false, "not user found!", 401);
  }
  // if (email !== user.email) {
  //   throw new ErrorResponse("Invalid email address!", 401);
  // }
  if (!signature) {
    throw new ErrorResponse(
      "No signature found, check environment variables",
      500
    );
  }

  const passwordToken = jwt.sign({ userId }, signature, { expiresIn: "1h" });

  const message = `Dear User,

  From your request, we are sending this email to update your password. Please follow this link to update:

  http://localhost:8080/public/passwordChange/?token=${passwordToken}

  Thank you,
  HealthCare.com`;

  const mailBody = makeBody(user.email, "Change Password", message);

  try {
    await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: mailBody,
      },
    });
    res
      .status(200)
      .send(new SuccessResponse(true, 200, "Email sent successfully"));
  } catch (error) {
    throw new ErrorResponse("Failed to send email", 500);
  }
});

export { sendMail, authToken, oauthCallback, authMiddle };
