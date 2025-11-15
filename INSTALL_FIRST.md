# Quick Installation Guide

## 🚀 Get Started in 5 Minutes

### 1. Install System Dependencies (macOS)

```bash
# Install PortAudio (required for pyaudio/microphone access)
brew install portaudio
```

**For Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install portaudio19-dev python3-pyaudio
```

**For Windows:**
- pyaudio should install automatically via pip

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**If pyaudio fails to install on macOS:**
```bash
# Make sure PortAudio is installed first
brew install portaudio

# Then try installing pyaudio with these flags:
pip install --global-option='build_ext' --global-option='-I/opt/homebrew/include' --global-option='-L/opt/homebrew/lib' pyaudio
```

### 3. Setup Environment Variables

```bash
# Copy the example file
cp env.example .env

# Edit .env and add your API keys:
nano .env
```

Add these keys:
```bash
OPENAI_API_KEY=sk-proj-your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

Get your keys:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

### 4. Grant Microphone Permissions

**macOS:**
- System Preferences > Security & Privacy > Privacy > Microphone
- Grant access to Terminal (or your terminal app)

**Linux:**
- Usually works by default
- Check `alsamixer` if you have issues

**Windows:**
- Settings > Privacy > Microphone
- Allow desktop apps to access microphone

### 5. Test Your Setup

```bash
# Terminal 1 - Start backend
python run.py

# Terminal 2 - Run test
python test.py
```

---

## 🎤 Voice Test

When you run `python test.py`, you should:
1. See "✅ Connected to OpenAI Realtime API"
2. Hear the AI speaking to you
3. Be able to speak your responses
4. See transcripts in real-time

---

## ❓ Common Issues

### "No module named 'pyaudio'"
```bash
# macOS
brew install portaudio
pip install pyaudio

# Linux
sudo apt-get install portaudio19-dev
pip install pyaudio
```

### "No module named 'websockets'"
```bash
pip install websockets
```

### "OPENAI_API_KEY is required"
- Make sure `.env` file exists
- Check the key is correct (starts with `sk-proj-` or `sk-`)
- Restart the test script after adding the key

### Microphone not working
- Check System Preferences > Microphone permissions
- Test your microphone in another app first
- Make sure speakers/headphones are connected
- Try `python -m pyaudio` to test audio setup

### "WebSocket connection failed"
- Verify your OpenAI API key is valid
- Check you have access to GPT-4 Realtime API
- Ensure you have network connectivity

---

## ✅ Success Indicators

You'll know it's working when you see:
1. ✅ Survey created
2. ✅ Session started
3. ✅ Connected to OpenAI Realtime API
4. 🎤 Session created, ready to speak!
5. [Agent]: AI speaking to you...
6. [You]: Your voice transcribed in real-time

---

## 📚 Next Steps

Once installed, check out:
- [README.md](README.md) - Full project overview
- [SETUP.md](SETUP.md) - Detailed configuration guide
- API Docs: http://localhost:8000/docs (when running)

**Happy surveying! 🎉**

