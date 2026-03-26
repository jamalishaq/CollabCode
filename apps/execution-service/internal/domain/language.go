package domain

import "strings"

// Language contains runtime metadata used to execute code.
type Language struct {
	Name        string
	DockerImage string
	FileName    string
	ExecCmd     []string
}

var supportedLanguages = map[string]Language{
	"python": {
		Name:        "python",
		DockerImage: "python:3.12-alpine",
		FileName:    "main.py",
		ExecCmd:     []string{"python3", "$FILE"},
	},
	"javascript": {
		Name:        "javascript",
		DockerImage: "node:20-alpine",
		FileName:    "main.js",
		ExecCmd:     []string{"node", "$FILE"},
	},
	"typescript": {
		Name:        "typescript",
		DockerImage: "node:20-alpine",
		FileName:    "main.ts",
		ExecCmd:     []string{"sh", "-lc", "ts-node $FILE"},
	},
	"go": {
		Name:        "go",
		DockerImage: "golang:1.22-alpine",
		FileName:    "main.go",
		ExecCmd:     []string{"go", "run", "$FILE"},
	},
	"rust": {
		Name:        "rust",
		DockerImage: "rust:1.76-alpine",
		FileName:    "main.rs",
		ExecCmd:     []string{"sh", "-lc", "rustc $FILE -o ./main && ./main"},
	},
}

// CommandForFile returns a command with file placeholder substituted.
func (l Language) CommandForFile(filePath string) []string {
	cmd := make([]string, len(l.ExecCmd))
	for i, part := range l.ExecCmd {
		cmd[i] = strings.ReplaceAll(part, "$FILE", filePath)
	}
	return cmd
}

// ResolveLanguage fetches supported language config.
func ResolveLanguage(name string) (Language, bool) {
	language, ok := supportedLanguages[name]
	return language, ok
}
