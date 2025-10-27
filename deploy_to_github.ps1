Write-Host "Starting Git Deployment..." -ForegroundColor Green

# Check if Git is installed
try {
    git --version
    Write-Host "✅ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Initialize Git repository if not exists
if (-Not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Add all files to Git
git add .

# Commit changes
git commit -m "Enhanced Compliance Platform with Advanced Analytics

- Added advanced reporting & analytics dashboard
- Compliance score calculations and trend analysis
- Risk heat maps and gap analysis reports
- Export capabilities (PDF/Excel)
- Enhanced backend APIs for analytics
- Smoke testing suite
- Updated navigation and UI

All features fully operational and tested."

Write-Host "✅ Changes committed locally" -ForegroundColor Green

# Add GitHub remote (if not already added)
 = git remote get-url origin 2>
if (-1073741510 -ne 0) {
    git remote add origin https://github.com/cyberposture2023-netizen/AI-Audit-Compliance-Platform-.git
    Write-Host "✅ GitHub remote added" -ForegroundColor Green
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

if (-1073741510 -eq 0) {
    Write-Host "🎉 SUCCESS: Compliance Platform deployed to GitHub!" -ForegroundColor Green
    Write-Host "📚 Repository: https://github.com/cyberposture2023-netizen/AI-Audit-Compliance-Platform-" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to push to GitHub. Please check your credentials." -ForegroundColor Red
}
