const { listDirectory, getDataPath } = useElectron();

export default async function getAllProfilePics(personaId: string) {
	if (!listDirectory) {
		throw new Error('listDirectory is not defined');
	}

	const dataPath = await getDataPath('images/' + personaId);
	const files = await listDirectory(dataPath);
	const images = files.filter((f) => f.endsWith('.png'));

	images.sort((a, b) => b.localeCompare(a));

	return images;
}
