import { handleContactRequest } from "../../server/contact.mjs";

export function onRequest(context) {
  return handleContactRequest(context.request, context.env);
}
