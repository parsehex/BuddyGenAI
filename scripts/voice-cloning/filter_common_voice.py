import pandas as pd
import os
import shutil

# === USER CONFIG ===
DATASET_DIR = "/Users/user/Downloads/cv-corpus-13.0-delta-2023-03-09"  # folder containing en/clips and validated.tsv
LANG_CODE = "en"  # subfolder for language
REMOVE_REJECTED = True  # if True, delete filtered files
SORT_INTO_FOLDERS = True  # if True, move kept files into folders (e.g., by upvotes)
RENAME_FILES = True  # if True, append upvote count to filenames

# === FILTER TOGGLES ===
MIN_UPVOTES = 1
REQUIRE_AGE = True
REQUIRE_GENDER = True

# =====================

# Paths
validated_path = os.path.join(DATASET_DIR, LANG_CODE, "validated.tsv")
clips_dir = os.path.join(DATASET_DIR, LANG_CODE, "clips")

# Load table
df = pd.read_csv(validated_path, sep="\t")

print(f"Loaded {len(df)} entries from validated.tsv")

# Apply filters
mask = pd.Series(True, index=df.index)

if MIN_UPVOTES is not None:
	mask &= df["up_votes"] >= MIN_UPVOTES

if REQUIRE_AGE:
	mask &= df["age"].notna()

if REQUIRE_GENDER:
	mask &= df["gender"].notna()

kept_df = df[mask].copy()
removed_df = df[~mask].copy()

print(f"Keeping {len(kept_df)} entries, removing {len(removed_df)} entries")

# Remove rejected audio files
if REMOVE_REJECTED:
	for filename in removed_df["path"]:
		file_path = os.path.join(clips_dir, filename)
		if os.path.exists(file_path):
			os.remove(file_path)

# Rename files if enabled
if RENAME_FILES:
	new_paths = []
	for idx, row in kept_df.iterrows():
		base, ext = os.path.splitext(row["path"])
		new_name = f"{base}_up{row['up_votes']}{ext}"
		old_path = os.path.join(clips_dir, row["path"])
		new_path = os.path.join(clips_dir, new_name)
		if os.path.exists(old_path):
			os.rename(old_path, new_path)
		new_paths.append(new_name)
	kept_df["path"] = new_paths

# Sort into folders if enabled
if SORT_INTO_FOLDERS:
	for idx, row in kept_df.iterrows():
		upvote_folder = f"up{row['up_votes']}"
		folder_path = os.path.join(clips_dir, upvote_folder)
		os.makedirs(folder_path, exist_ok=True)
		old_path = os.path.join(clips_dir, row["path"])
		new_path = os.path.join(folder_path, row["path"])
		if os.path.exists(old_path):
			shutil.move(old_path, new_path)
			kept_df.at[idx, "path"] = os.path.join(upvote_folder, row["path"])

# Save updated validated.tsv
kept_df.to_csv(validated_path, sep="\t", index=False)
print("Updated validated.tsv saved.")
