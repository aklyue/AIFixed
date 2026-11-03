package migrations

import "embed"

// Вытаскиваем все sql-файлы из текущей директории в переменную пакета
//go:embed *.sql
var FS embed.FS
