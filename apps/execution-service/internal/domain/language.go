package domain

// Language contains runtime metadata used to execute code.
type Language struct {
	Name      string
	Image     string
	Extension string
	FileName  string
	RunCmd    []string
}

var supportedLanguages = map[string]Language{
	"python": {
		Name:      "python",
		Image:     "python:3.12-alpine",
		Extension: ".py",
		FileName:  "main.py",
		RunCmd:    []string{"python", "/workspace/main.py"},
	},
	"javascript": {
		Name:      "javascript",
		Image:     "node:20-alpine",
		Extension: ".js",
		FileName:  "main.js",
		RunCmd:    []string{"node", "/workspace/main.js"},
	},
	"typescript": {
		Name:      "typescript",
		Image:     "node:20-alpine",
		Extension: ".ts",
		FileName:  "main.ts",
		RunCmd:    []string{"sh", "-lc", "npm install -g ts-node typescript >/dev/null 2>&1 && ts-node /workspace/main.ts"},
	},
	"go": {
		Name:      "go",
		Image:     "golang:1.22-alpine",
		Extension: ".go",
		FileName:  "main.go",
		RunCmd:    []string{"go", "run", "/workspace/main.go"},
	},
	"rust": {
		Name:      "rust",
		Image:     "rust:1.76-alpine",
		Extension: ".rs",
		FileName:  "main.rs",
		RunCmd:    []string{"sh", "-lc", "rustc /workspace/main.rs -o /tmp/main && /tmp/main"},
	},
}

// ResolveLanguage fetches supported language config.
func ResolveLanguage(name string) (Language, bool) {
	language, ok := supportedLanguages[name]
	return language, ok
}
