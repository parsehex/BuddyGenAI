import { clearDatabase, db, tableNames } from './schema';
import JSZip from 'jszip';

/**
 * Converts a Uint8Array to a base64 string.
 * @param bytes The Uint8Array to convert.
 * @param mimeType The MIME type of the data (e.g., 'image/png').
 * @returns A base64 string with data URI prefix.
 */
function uint8ArrayToBase64(bytes: Uint8Array, mimeType: string): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Converts a Uint8Array to a Blob.
 * @param bytes The Uint8Array to convert.
 * @param mimeType The MIME type of the data (e.g., 'audio/mpeg').
 * @returns A Blob containing the binary data.
 */
function uint8ArrayToBlob(bytes: Uint8Array, mimeType: string): Blob {
	// @ts-ignore
	return new Blob([bytes], { type: mimeType });
}

/**
 * Infers the MIME type from a file extension.
 * @param extension The file extension (e.g., 'png', 'mp3').
 * @returns The inferred MIME type (e.g., 'image/png'), or 'application/octet-stream' if unknown.
 */
function getMimeTypeFromExtension(extension: string): string {
	switch (extension.toLowerCase()) {
		case 'png':
			return 'image/png';
		case 'jpeg':
			return 'image/jpeg';
		case 'jpg':
			return 'image/jpeg';
		case 'gif':
			return 'image/gif';
		case 'webp':
			return 'image/webp';
		case 'mp3':
			return 'audio/mpeg';
		case 'wav':
			return 'audio/wav';
		case 'ogg':
			return 'audio/ogg';
		case 'json':
			return 'application/json';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Imports a database from a ZIP file.
 * Clears existing data and populates with data from the ZIP.
 * @param file The ZIP file to import.
 */
export async function importDatabaseFromZip(file: File): Promise<void> {
	const zip = new JSZip();
	const loadedZip = await zip.loadAsync(file);

	const dbExportFolder = loadedZip.folder('buddygenai_db_export');
	if (!dbExportFolder) {
		throw new Error('Invalid ZIP file: Missing "buddygenai_db_export" folder.');
	}

	await clearDatabase();

	// Import data
	for (const tableName of tableNames) {
		const jsonFile = dbExportFolder.file(`${tableName}.json`);
		if (jsonFile) {
			const jsonData = await jsonFile.async('string');
			const records = JSON.parse(jsonData);
			const table = (db as any)[tableName];

			if (table) {
				const recordsToPut: any[] = [];

				if (tableName === 'images' || tableName === 'audio') {
					for (const record of records) {
						if (
							record.data &&
							typeof record.data === 'string' &&
							record.data.startsWith('./')
						) {
							const filePath = record.data.substring(2); // Remove './' prefix
							const mediaFile = dbExportFolder.file(filePath);
							if (mediaFile) {
								const binaryData = await mediaFile.async('uint8array');
								const fileExtension = filePath.split('.').pop() || 'bin';
								const mimeType = getMimeTypeFromExtension(fileExtension);

								if (tableName === 'images') {
									record.data = uint8ArrayToBase64(binaryData, mimeType);
								} else if (tableName === 'audio') {
									record.data = uint8ArrayToBlob(binaryData, mimeType);
								}
								recordsToPut.push(record);
							} else {
								console.warn(
									`Media file not found for record in ${tableName}: ${filePath}`
								);
								recordsToPut.push(record); // Include record even if media file is missing
							}
						} else {
							recordsToPut.push(record); // Include record if data is not a file path
						}
					}
				} else {
					recordsToPut.push(...records);
				}
				await table.bulkPut(recordsToPut);
				console.log(
					`Imported ${recordsToPut.length} records into table: ${tableName}`
				);
			} else {
				console.warn(
					`Table '${tableName}' not found in database schema during import.`
				);
			}
		} else {
			console.warn(`JSON file for table '${tableName}' not found in ZIP.`);
		}
	}
}
