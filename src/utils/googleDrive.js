// Client-side Google Drive upload using Google Identity Services (GIS) + the
// non-sensitive `drive.file` scope — this scope only grants access to files
// the app itself creates, so it does NOT require Google's app verification
// or a CASA security assessment, even in production.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

let gisLoadPromise = null;
function loadGis() {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

let tokenClient = null;
let cachedToken = null; // { access_token, expiresAt }

async function getAccessToken(clientId) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.access_token;
  }
  await loadGis();

  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: () => {}, // set per-call below
      });
    }
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      cachedToken = {
        access_token: resp.access_token,
        expiresAt: Date.now() + (resp.expires_in || 3600) * 1000,
      };
      resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

async function findOrCreateFolder(accessToken, parentId, folderName) {
  const safeName = folderName.replace(/'/g, "\\'");
  const q = encodeURIComponent(
    `'${parentId}' in parents and name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) throw new Error("Could not look up Drive folder (" + listRes.status + ")");
  const listData = await listRes.json();
  if (listData.files?.length > 0) return listData.files[0].id;

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  if (!createRes.ok) throw new Error("Could not create Drive folder (" + createRes.status + ")");
  const createData = await createRes.json();
  return createData.id;
}

async function uploadFile(accessToken, file, parentId) {
  const metadata = { name: file.name, parents: [parentId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!res.ok) throw new Error("Drive upload failed (" + res.status + ")");
  return res.json(); // { id, webViewLink }
}

async function makePublicReadable(accessToken, fileId) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
  if (!res.ok) throw new Error("Could not set link sharing (" + res.status + ")");
}

/**
 * Uploads `file` into (root)/(stationCode)/ in Drive, makes it link-shareable,
 * and returns the shareable view URL to store as the document's `url`.
 */
export async function uploadDocumentToDrive({ clientId, rootFolderId, stationCode, file, onStatus }) {
  if (!clientId) throw new Error("Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID).");
  if (!rootFolderId) throw new Error("Google Drive root folder is not configured (VITE_GDRIVE_ROOT_FOLDER_ID).");

  onStatus?.("Authorizing with Google...");
  const accessToken = await getAccessToken(clientId);

  onStatus?.("Preparing station folder...");
  const folderId = stationCode ? await findOrCreateFolder(accessToken, rootFolderId, stationCode.toUpperCase()) : rootFolderId;

  onStatus?.("Uploading file...");
  const uploaded = await uploadFile(accessToken, file, folderId);

  onStatus?.("Enabling link sharing...");
  await makePublicReadable(accessToken, uploaded.id);

  return { url: uploaded.webViewLink, fileId: uploaded.id };
}
