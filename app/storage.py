import json
import os
from typing import Dict, List, Optional
from pathlib import Path
from app.models import Survey, Session


DATA_DIR = Path("data")
SURVEYS_FILE = DATA_DIR / "surveys.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"


class JSONStorage:
    def __init__(self):
        # Create data directory if it doesn't exist
        DATA_DIR.mkdir(exist_ok=True)
        
        # Initialize files if they don't exist
        if not SURVEYS_FILE.exists():
            self._write_file(SURVEYS_FILE, {})
        if not SESSIONS_FILE.exists():
            self._write_file(SESSIONS_FILE, {})
    
    def _read_file(self, filepath: Path) -> Dict:
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def _write_file(self, filepath: Path, data: Dict):
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    # Survey operations
    def create_survey(self, survey: Survey) -> Survey:
        surveys = self._read_file(SURVEYS_FILE)
        surveys[survey.survey_id] = survey.model_dump()
        self._write_file(SURVEYS_FILE, surveys)
        return survey
    
    def get_survey(self, survey_id: str) -> Optional[Survey]:
        surveys = self._read_file(SURVEYS_FILE)
        if survey_id in surveys:
            return Survey(**surveys[survey_id])
        return None
    
    def list_surveys(self) -> List[Survey]:
        surveys = self._read_file(SURVEYS_FILE)
        return [Survey(**s) for s in surveys.values()]
    
    # Session operations
    def create_session(self, session: Session) -> Session:
        sessions = self._read_file(SESSIONS_FILE)
        sessions[session.session_id] = session.model_dump()
        self._write_file(SESSIONS_FILE, sessions)
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        sessions = self._read_file(SESSIONS_FILE)
        if session_id in sessions:
            return Session(**sessions[session_id])
        return None
    
    def update_session(self, session_id: str, updates: Dict) -> Optional[Session]:
        sessions = self._read_file(SESSIONS_FILE)
        if session_id in sessions:
            sessions[session_id].update(updates)
            self._write_file(SESSIONS_FILE, sessions)
            return Session(**sessions[session_id])
        return None
    
    def get_sessions_by_survey(self, survey_id: str) -> List[Session]:
        sessions = self._read_file(SESSIONS_FILE)
        return [
            Session(**s) 
            for s in sessions.values() 
            if s.get('survey_id') == survey_id
        ]


# Global storage instance
storage = JSONStorage()

