# GitHub Workflows for Lyra Browser Extension

This directory contains GitHub Actions workflows that automate testing, building, and quality assurance for the Lyra browser extension project.

## Workflows Overview

### 🔧 CI (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Releases

Main continuous integration workflow that:
- **Tests & Lints:** Validates manifest files, checks required files, lints JavaScript
- **Builds Extensions:** Creates Firefox (.xpi) and Chrome (.zip) packages using `build.sh`
- **Security Scan:** Checks for secrets, validates permissions, scans for potential vulnerabilities
- **Release Automation:** Automatically attaches built extensions to GitHub releases

**Artifacts:** Built extension packages are uploaded and available for download for 30 days.

### 🔒 Security & Dependencies (`security.yml`)
**Triggers:** Daily at 2 AM UTC, Manual dispatch, Changes to package/manifest files

Comprehensive security and dependency monitoring:
- **Security Audit:** npm audit, source code vulnerability scanning
- **Manifest Validation:** Validates both Firefox and Chrome manifests
- **File Integrity:** Ensures all referenced files exist and have correct permissions
- **Code Quality:** Checks for console.log statements, TODOs, and other code quality issues

### 🎨 Code Style & Formatting (`code-style.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests

Enforces consistent code style and formatting:
- **Prettier Formatting:** Checks JavaScript, CSS, and HTML file formatting
- **ESLint:** Lints JavaScript files for errors and style issues
- **Manifest Style:** Validates JSON formatting in manifest files
- **EditorConfig:** Ensures files comply with `.editorconfig` settings
- **Whitespace:** Checks for trailing whitespace and mixed line endings

**Auto-fix:** Provides commands to automatically fix formatting issues locally.

### 📋 Pull Request Validation (`pr-validation.yml`)
**Triggers:** Pull Request opened, updated, or reopened

Comprehensive PR validation and analysis:
- **PR Analysis:** Examines changed files, validates PR title and description format
- **Security Review:** Extra security checks for PRs that modify permissions or source code
- **Build Testing:** Tests that the extension still builds correctly with PR changes
- **Size Monitoring:** Warns if extension packages are getting too large
- **Validation Summary:** Provides comprehensive feedback on PR status

## Setup Requirements

### For Full Functionality
These workflows work out of the box, but you can enhance them by adding:

1. **package.json** (optional): For npm dependency management and additional tooling
2. **.prettierrc** (optional): Custom Prettier configuration
3. **.eslintrc.json** (optional): Custom ESLint configuration
4. **.editorconfig** (optional): EditorConfig settings for consistent formatting

### Default Configurations
If configuration files are missing, the workflows will create sensible defaults:
- Prettier config with 2-space indentation, semicolons, double quotes
- ESLint config for browser extensions with security rules
- Basic validation rules for manifests and source code

## Workflow Status Badges

Add these badges to your main README.md:

```markdown
[![CI](https://github.com/YOUR_USERNAME/lyra/workflows/CI/badge.svg)](https://github.com/YOUR_USERNAME/lyra/actions/workflows/ci.yml)
[![Security](https://github.com/YOUR_USERNAME/lyra/workflows/Security%20%26%20Dependencies/badge.svg)](https://github.com/YOUR_USERNAME/lyra/actions/workflows/security.yml)
[![Code Style](https://github.com/YOUR_USERNAME/lyra/workflows/Code%20Style%20%26%20Formatting/badge.svg)](https://github.com/YOUR_USERNAME/lyra/actions/workflows/code-style.yml)
```

## Local Development

### Running Checks Locally
Before pushing, you can run similar checks locally:

```bash
# Install tools
npm install -g prettier eslint

# Check formatting
prettier --check 'src/**/*.{js,css,html}'

# Check linting
eslint 'src/**/*.js'

# Format code
prettier --write 'src/**/*.{js,css,html}'
eslint --fix 'src/**/*.js'

# Validate JSON
python3 -m json.tool manifest.json
python3 -m json.tool manifest.chrome.json

# Build extensions
./build.sh
```

### PR Guidelines
To ensure your PRs pass validation:

1. **Title Format:** Use conventional commit format
   - `feat(scope): description` - New features
   - `fix(scope): description` - Bug fixes
   - `docs: description` - Documentation changes
   - `style: description` - Code style changes
   - `refactor: description` - Code refactoring
   - `test: description` - Test changes
   - `chore: description` - Maintenance tasks

2. **Description:** Include:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes

3. **Code Quality:**
   - Run formatters and linters locally first
   - Remove console.log statements from production code
   - Ensure all referenced files exist
   - Be cautious with new permissions in manifest files

## Security Considerations

The workflows include several security checks:
- **Permission Changes:** Flags when new permissions are added to manifests
- **Code Vulnerabilities:** Scans for eval(), innerHTML, and external URLs
- **Secrets Detection:** Basic check for API keys and tokens in code
- **File Integrity:** Ensures no executable JavaScript files or world-writable files

## Customization

You can customize these workflows by:
1. Modifying trigger conditions in the `on:` sections
2. Adjusting ESLint/Prettier rules in the configuration files
3. Adding/removing security checks based on your needs
4. Modifying notification and reporting behavior

## Troubleshooting

### Common Issues
- **Build Failures:** Check that `build.sh` is executable and all required files exist
- **Formatting Errors:** Run `prettier --write` and `eslint --fix` locally
- **Security Warnings:** Review flagged code changes for actual security implications
- **Size Warnings:** Consider optimizing assets or removing unused code

### Getting Help
- Check the Actions tab in your GitHub repository for detailed logs
- Each workflow provides specific error messages and suggestions
- The workflows include auto-fix suggestions for common formatting issues