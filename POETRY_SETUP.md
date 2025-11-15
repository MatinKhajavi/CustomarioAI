# Poetry Setup Guide

## Install Poetry

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

## Initialize Poetry in This Project

### Step 1: Configure Poetry to Create .venv Locally

```bash
# This ensures .venv is created in the project directory
poetry config virtualenvs.in-project true
```

### Step 2: Initialize Poetry

```bash
# Initialize Poetry (it will create pyproject.toml)
poetry init --no-interaction --name customario-ai --python "^3.9"
```

### Step 3: Add Dependencies from requirements.txt

```bash
# Add each dependency (Poetry will resolve versions)
poetry add fastapi==0.115.0
poetry add uvicorn==0.30.0
poetry add pydantic==2.9.0
poetry add python-dotenv==1.0.1
poetry add anthropic==0.39.0
poetry add livekit==0.17.0
poetry add httpx==0.27.0

# Add livekit-agents with extras
poetry add "livekit-agents[silero,turn-detector]==1.2.0"

# Add plugins
poetry add livekit-plugins-noise-cancellation==0.2.0
```

### Alternative: Bulk Add (Faster)

```bash
# All at once
poetry add \
  fastapi==0.115.0 \
  uvicorn==0.30.0 \
  pydantic==2.9.0 \
  python-dotenv==1.0.1 \
  anthropic==0.39.0 \
  livekit==0.17.0 \
  httpx==0.27.0 \
  "livekit-agents[silero,turn-detector]==1.2.0" \
  livekit-plugins-noise-cancellation==0.2.0
```

### Step 4: Install Dependencies

```bash
# This creates the .venv and installs everything
poetry install
```

### Step 5: Activate Virtual Environment

```bash
# Activate the virtual environment
poetry shell
```

## Running the Project with Poetry

### Option 1: Within Poetry Shell

```bash
poetry shell
python run.py
python test_widget_flow.py
```

### Option 2: Run Commands Directly

```bash
# Run without activating shell
poetry run python run.py
poetry run python test_widget_flow.py
poetry run python test_agents.py
```

## Useful Poetry Commands

```bash
# Show installed packages
poetry show

# Update dependencies
poetry update

# Add a new package
poetry add package-name

# Add dev dependency
poetry add --group dev pytest

# Remove a package
poetry remove package-name

# Export to requirements.txt
poetry export -f requirements.txt --output requirements.txt --without-hashes

# Check for dependency issues
poetry check

# Show virtual environment info
poetry env info

# List virtual environments
poetry env list

# Remove virtual environment
poetry env remove python
```

## Development Dependencies (Optional)

```bash
# Add dev tools
poetry add --group dev pytest black ruff mypy
```

## Verify Installation

```bash
# Check Python version
poetry run python --version

# Test imports
poetry run python -c "import anthropic; import livekit; print('✓ All imports work')"

# Run the server
poetry run python run.py
```

## Troubleshooting

### If .venv is not in project directory

```bash
poetry config virtualenvs.in-project true
poetry install  # Recreates .venv in project
```

### If dependencies conflict

```bash
# Let Poetry resolve conflicts
poetry lock
poetry install
```

### Clear cache and reinstall

```bash
poetry cache clear pypi --all
rm -rf .venv poetry.lock
poetry install
```

## .gitignore for Poetry

Your `.gitignore` already includes:
```
.venv/
poetry.lock  # Optional: commit this for reproducible builds
```

## Why Poetry?

✅ **Dependency Resolution** - Smart conflict resolution
✅ **Lock File** - Reproducible installations
✅ **Virtual Env Management** - Built-in .venv handling
✅ **Easy Publishing** - If you want to publish as package
✅ **Dev Dependencies** - Separate dev/prod dependencies
✅ **Modern** - Industry standard for Python projects

