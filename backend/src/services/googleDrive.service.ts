import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.G_DRIVE_REFRESH;

// The shared folder ID provided in .env
const TARGET_FOLDER_ID = process.env.G_DRIVE_FOLDER_ID || '1b0hif7vwxmXJvI4nURkMIwGyW_rUnkgl';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Uploads a file to a specific Google Drive folder.
 * @param filePath Local path to the file
 * @param fileName Name to save the file as on Drive
 * @param mimeType MIME type of the file
 * @returns Object containing the Drive file ID and webViewLink
 */
export const uploadToDrive = async (filePath: string, fileName: string, mimeType: string) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [TARGET_FOLDER_ID],
      },
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      },
      fields: 'id, webViewLink',
    });

    // Make the file publicly viewable (optional, but usually needed for sharing)
    // await drive.permissions.create({
    //   fileId: response.data.id!,
    //   requestBody: {
    //     role: 'reader',
    //     type: 'anyone',
    //   },
    // });

    return {
      id: response.data.id,
      link: response.data.webViewLink,
    };
  } catch (error: any) {
    console.error('Google Drive Upload Error:', error.message);
    throw new Error('Failed to upload file to Google Drive');
  }
};

/**
 * Deletes a file from Google Drive.
 */
export const deleteFromDrive = async (fileId: string) => {
  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error: any) {
    console.error('Google Drive Delete Error:', error.message);
    return false;
  }
};
