import { db, tableNames } from './schema';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Converts a base64 string to a Uint8Array.
 * Handles common data URI prefixes.
 * @param base64String The base64 string, optionally with a data URI prefix.
 * @returns A Uint8Array containing the decoded binary data.
 */
function dataToUint8Array(data: string | Blob): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		if (typeof data === 'string') {
			const base64 = data.split(',')[1] || data; // Remove data URI prefix if present
			try {
				const binaryString = atob(base64);
				const len = binaryString.length;
				const bytes = new Uint8Array(len);
				for (let i = 0; i < len; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				resolve(bytes);
			} catch (e) {
				reject(new Error('Invalid base64 string'));
			}
		} else if (data instanceof Blob) {
			const reader = new FileReader();
			reader.onload = () => {
				if (reader.result instanceof ArrayBuffer) {
					resolve(new Uint8Array(reader.result));
				} else {
					reject(new Error('Failed to read Blob as ArrayBuffer'));
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(data);
		} else {
			reject(new Error('Unsupported data type for conversion to Uint8Array'));
		}
	});
}

/**
 * Infers the file extension from a base64 data URI or Blob.
 * @param data The base64 string (expected to have a data URI prefix) or Blob.
 * @returns The inferred file extension (e.g., 'png', 'jpeg', 'mp3'), or 'bin' if unknown.
 */
function getFileExtensionFromData(data: string | Blob): string {
	if (typeof data === 'string') {
		const mimeMatch = data.match(
			/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\.]+);base64,/
		);
		if (mimeMatch && mimeMatch[1]) {
			const mimeType = mimeMatch[1];
			switch (mimeType) {
				case 'image/png':
					return 'png';
				case 'image/jpeg':
					return 'jpeg';
				case 'image/gif':
					return 'gif';
				case 'image/webp':
					return 'webp';
				case 'audio/mpeg':
					return 'mp3';
				case 'audio/wav':
					return 'wav';
				case 'audio/ogg':
					return 'ogg';
				default:
					return mimeType.split('/')[1] || 'bin';
			}
		}
	} else if (data instanceof Blob) {
		const mimeType = data.type;
		if (mimeType) {
			switch (mimeType) {
				case 'image/png':
					return 'png';
				case 'image/jpeg':
					return 'jpeg';
				case 'image/gif':
					return 'gif';
				case 'image/webp':
					return 'webp';
				case 'audio/mpeg':
					return 'mp3';
				case 'audio/wav':
					return 'wav';
				case 'audio/ogg':
					return 'ogg';
				default:
					return mimeType.split('/')[1] || 'bin';
			}
		}
	}
	return 'bin'; // Default to binary if no MIME type found
}

/**
 * Exports the entire Dexie database to a ZIP file.
 * Includes all tables, with images and audio converted from base64 to binary files.
 */
export async function exportDatabaseToZip(): Promise<void> {
	const zip = new JSZip();
	const dbExportFolder = zip.folder('buddygenai_db_export');

	if (!dbExportFolder) {
		throw new Error('Could not create export folder in zip.');
	}

	for (const tableName of tableNames) {
		const table = (db as any)[tableName];
		if (table) {
			const records = await table.toArray();
			const dataToSave: any[] = [];

			if (tableName === 'images' || tableName === 'audio') {
				const mediaFolder = dbExportFolder.folder(tableName);
				if (!mediaFolder) {
					throw new Error(`Could not create media folder for ${tableName}.`);
				}
				for (const record of records) {
					if (record.data) {
						const fileExtension = getFileExtensionFromData(record.data);
						const fileName = `${tableName}_${record.id}.${fileExtension}`;
						const binaryData = dataToUint8Array(record.data);
						mediaFolder.file(fileName, binaryData);
						// Store a reference to the file path in the JSON for the record
						dataToSave.push({ ...record, data: `./${tableName}/${fileName}` });
					} else {
						dataToSave.push(record); // Include record even if data is missing
					}
				}
			} else {
				dataToSave.push(...records);
			}
			dbExportFolder.file(
				`${tableName}.json`,
				JSON.stringify(dataToSave, null, 2)
			);
		} else {
			console.warn(`Table '${tableName}' not found in database schema.`);
		}
	}

	// Generate the ZIP file
	const content = await zip.generateAsync({ type: 'blob' });

	// Trigger the download
	saveAs(
		content,
		`buddygenai_db_export_${new Date().toISOString().slice(0, 10)}.zip`
	);
}
