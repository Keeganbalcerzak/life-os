# 📥 How to Install Git on Windows

## Method 1: Official Git for Windows (Recommended)

### Step 1: Download Git
1. Go to: **https://git-scm.com/download/win**
2. Click the download button (auto-detects 64-bit or 32-bit)
3. The installer downloads (usually `Git-2.x.x-64-bit.exe`)

### Step 2: Install Git
1. **Run the installer** you just downloaded
2. Click **"Next"** through the setup:
   - **License:** Click Next (accepts license)
   - **Select Components:** 
     - ✅ Keep defaults checked
     - ✅ Make sure "Git Bash Here" is checked
   - **Default Editor:** Choose your editor:
     - Visual Studio Code (if you have it)
     - OR Notepad++ 
     - OR Nano
     - OR Vim (if you're comfortable)
   - **Initial Branch Name:** 
     - Choose **"Let Git decide"** (recommended)
   - **PATH Environment:**
     - Choose **"Git from the command line and also from 3rd-party software"** ⭐ (Important!)
   - **SSH Executable:**
     - Choose **"Use bundled OpenSSH"** (default)
   - **HTTPS:**
     - Choose **"Use the OpenSSL library"** (default)
   - **Line Ending Conversions:**
     - Choose **"Checkout Windows-style, commit Unix-style line endings"** (default)
   - **Terminal Emulator:**
     - Choose **"Use Windows' default console window"** (recommended)
   - **Default Behavior:**
     - Choose **"Default (fast-forward or merge)"** (default)
   - **Credential Helper:**
     - Choose **"Git Credential Manager"** (default)
   - **Extra Options:**
     - ✅ Enable file system caching (recommended)
     - ✅ Enable symbolic links (optional)
   - **Experimental Options:**
     - Leave unchecked (unless you want to try new features)

3. Click **"Install"**
4. Wait for installation to complete
5. Click **"Finish"**

### Step 3: Verify Installation
1. **Open PowerShell** (Windows key → type "PowerShell" → Enter)
2. Type:
   ```bash
   git --version
   ```
3. You should see: `git version 2.x.x` ✅

---

## Method 2: Via Winget (Windows Package Manager)

If you have Windows 11 or Windows 10 with winget:

1. Open **PowerShell** (as Administrator)
2. Run:
   ```powershell
   winget install --id Git.Git -e --source winget
   ```
3. Wait for installation
4. Verify: `git --version`

---

## Method 3: Via Chocolatey (If you have it)

If you have Chocolatey installed:

1. Open **PowerShell** (as Administrator)
2. Run:
   ```powershell
   choco install git
   ```
3. Wait for installation
4. Verify: `git --version`

---

## ✅ After Installation: Configure Git

### First Time Setup (Optional but Recommended)

Open **PowerShell** or **Git Bash** and run:

```bash
# Set your name (replace with your actual name)
git config --global user.name "Your Name"

# Set your email (replace with your actual email)
git config --global user.email "your.email@example.com"

# Set default branch name to 'main'
git config --global init.defaultBranch main

# Verify settings
git config --list
```

**Why?** Git uses this info when you commit code. Makes your commits identifiable.

---

## 🧪 Test Git Installation

Run these commands in PowerShell:

```bash
# Check Git version
git --version

# Check Git config
git config --list

# Initialize a test repo (optional)
mkdir test-git
cd test-git
git init
git status
```

---

## 📚 What You Get

After installation, you'll have:

- **`git` command** - Main Git tool
- **Git Bash** - Unix-like terminal (right-click → "Git Bash Here")
- **Git GUI** - Visual Git interface (optional)
- **Git Credential Manager** - Saves GitHub passwords

---

## 🔗 Useful Git Commands (Quick Reference)

```bash
# Initialize repository
git init

# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your message"

# Connect to remote
git remote add origin https://github.com/username/repo.git

# Push to GitHub
git push -u origin main

# Clone a repository
git clone https://github.com/username/repo.git
```

---

## 🐛 Troubleshooting

### "git is not recognized"
- ✅ Restart your terminal/PowerShell
- ✅ Restart your computer
- ✅ Check installation: Go to Settings → Apps → Search "Git"
- ✅ Reinstall if needed

### "Permission denied"
- ✅ Make sure you're in the right folder
- ✅ Check file permissions
- ✅ Try running PowerShell as Administrator

### Can't push to GitHub
- ✅ Set up SSH keys OR
- ✅ Use HTTPS with Git Credential Manager (auto-saves password)

---

## 🎯 Next Steps

Once Git is installed:

1. **Test it:** `git --version`
2. **Configure:** Set your name and email
3. **Ready to deploy:** Follow `STEP_BY_STEP_DEPLOYMENT.md`

---

## 💡 Pro Tips

- **Git Bash** is great for running Unix commands on Windows
- **Git Credential Manager** saves your GitHub password (secure)
- **VS Code** has built-in Git support (visual interface)
- Use **GitHub Desktop** for a GUI if you prefer clicking over typing

---

**That's it! Git is now installed and ready to use.** 🎉

