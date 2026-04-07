import { google, sheets_v4 } from "googleapis";

/**
 * Metadata about the Google Sheets tabs.
 */
export async function getSheetTabs(accessToken: string, sheetId: string): Promise<string[]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });

    return (meta.data.sheets ?? [])
        .map(s => s.properties?.title ?? "")
        .filter(Boolean);
}

/**
 * Fetches row data from a specific sheet tab.
 * Uses strict typing to ensure the returning rows are processed safely.
 */
export async function getSheetData(
    accessToken: string,
    sheetId: string,
    targetSheetName?: string
): Promise<string[][]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    // 1. Fetch spreadsheet metadata to get the target tab
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    let sheetTitle = meta.data.sheets?.[0]?.properties?.title;

    if (targetSheetName) {
        const targetSheet = meta.data.sheets?.find(s => s.properties?.title === targetSheetName);
        if (targetSheet && targetSheet.properties?.title) {
            sheetTitle = targetSheet.properties.title;
        }
    }

    if (!sheetTitle) {
        throw new Error("No visible sheets found in this document.");
    }

    // 2. Fetch all data from that specific sheet dynamically
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `'${sheetTitle}'`,
    });

    const rows = response.data.values as string[][] | null || [];

    // 3. Filter out any completely empty rows (production safety)
    const nonEmptyRows = rows.filter((row: string[]) =>
        row.some((cell: string) =>
            cell !== undefined &&
            cell !== null &&
            String(cell).trim() !== ""
        )
    );

    return nonEmptyRows;
}
