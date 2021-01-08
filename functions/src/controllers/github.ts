import { Request } from "express";
import { db } from "../config/fbConfig";

// @desc    github webhook endpoint
// @route   POST /github
// @access  Public
export const addWebhookPayloadToQueue = async (request: Request, response: any) => {
  if (request.method !== "POST") return response.status(405).send("Only POST Requests Are Accepted");

  try {
    const payload = { headers: request.headers, body: request.body };
    const newDocRef = await db.collection("gh_webhook_queue").add(payload);
    response.status(200).send(`Added doc ${newDocRef.id} to queue for processing`);
  } catch (error) {
    response.status(500).send(error);
  }
};
