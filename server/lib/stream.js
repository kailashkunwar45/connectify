import {StreamChat} from "stream-chat";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("STREAM_API_KEY and STREAM_API_SECRET must be set");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
   await streamClient.upsertUsers([userData]);
   return userData;
  } catch (error) {
    console.error(`Error creating Stream user: ${error.message}`);
    throw error;
  }
};

export const generateStreamToken = async (userId) => {
  try {
    if (!apiKey || !apiSecret) return null;
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error(`Error generating Stream token: ${error.message}`);
    return null;
  }
};