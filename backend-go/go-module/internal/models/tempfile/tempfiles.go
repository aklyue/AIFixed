package tempfile

import "time"

type FileInfo struct {
	FileID       string    `json:"file_id"`
	OriginalName string    `json:"original_name"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	FilePath     string    `json:"file_path"`
	SizeBytes    *int64    `json:"size_bytes"`
}

func (f *FileInfo) IsExpired(CurrentTime time.Time) bool {
	return CurrentTime.After(f.ExpiresAt)
}

func (f *FileInfo) RemainingSeconds(CurrentTime time.Time) int {
	delta := f.ExpiresAt.Sub(CurrentTime)
	if int(delta) <= 0 {
		return 0
	}

	return int(delta.Seconds())
}

func (f *FileInfo) RemainingTime(CurrentTime time.Time) time.Duration {
	delta := f.ExpiresAt.Sub(CurrentTime)
	if delta <= 0 {
		return 0
	}

	return delta
}
