package tempfile

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	models "github.com/AIFixed/backend-go/internal/models/tempfile"
)

type TempfileService struct {
	mu              sync.RWMutex
	tempfileDir     string
	cleanupInterval int
	filesRegistry   map[string]*models.FileInfo
}

func NewTempfileService(tempfileDir string, cleanupInterval int) (*TempfileService, error) {
	err := os.MkdirAll(tempfileDir, 0755)
	if err != nil {
		return nil, err
	}

	return &TempfileService{
		tempfileDir:     tempfileDir,
		cleanupInterval: cleanupInterval,
		filesRegistry:   make(map[string]*models.FileInfo),
	}, nil
}

func (s *TempfileService) StartCleanupWorker(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(s.cleanupInterval))
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.cleanupOldFiles()
		}
	}
}

func (s *TempfileService) cleanupOldFiles() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	var expiredFileIDs []string

	for fileID, fileInfo := range s.filesRegistry {
		if fileInfo.IsExpired(now) {
			expiredFileIDs = append(expiredFileIDs, fileID)
		}
	}

	for _, fileID := range expiredFileIDs {
		fileInfo := s.filesRegistry[fileID]
		if err := os.Remove(fileInfo.FilePath); err != nil && !os.IsNotExist(err) {
			log.Printf("Tempfile delete error (%s): %v", fileID, err)
			continue
		}
		delete(s.filesRegistry, fileID)
		log.Printf("Удален временный файл: %s", fileID)
	}
}

func generateUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80

	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func (s *TempfileService) SaveFile(content []byte, originalName string, fileExt string, ttl time.Duration) (*models.FileInfo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	fileID := fmt.Sprintf("%s.%s", generateUUID(), fileExt)
	filePath := filepath.Join(s.tempfileDir, fileID)

	err := os.WriteFile(filePath, content, 0644)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	info := &models.FileInfo{
		FileID:       fileID,
		OriginalName: originalName,
		CreatedAt:    now,
		ExpiresAt:    now.Add(ttl),
		FilePath:     filePath,
		SizeBytes:    int64Ptr(int64(len(content))),
	}

	s.filesRegistry[fileID] = info

	return info, nil
}

func (s *TempfileService) GetFile(filename string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cleanName := filepath.Base(filename)
	filePath := filepath.Join(s.tempfileDir, cleanName)

	info, err := os.Stat(filePath)
	if os.IsNotExist(err) || info.IsDir() {
		return "", fmt.Errorf("file not found")
	}

	return filePath, nil
}

func int64Ptr(v int64) *int64 {
	return &v
}
